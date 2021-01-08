package main

import (
	"errors"
	"fmt"
	"os"
	"sync"
	"time"

	"io/ioutil"

	"github.com/golang/geo/s2"
	"github.com/paulmach/go.geojson"
)

type coverResult struct {
	Length int
	Size float64
}

var regionCoverers = []s2.RegionCoverer{
	s2.RegionCoverer{MinLevel: 1, MaxLevel: 9, MaxCells: 6000000},	// geohash 4
	s2.RegionCoverer{MinLevel: 1, MaxLevel: 12, MaxCells: 6000000}, // geohash 5
	s2.RegionCoverer{MinLevel: 1, MaxLevel: 14, MaxCells: 6000000}, // geohash 6
	s2.RegionCoverer{MinLevel: 1, MaxLevel: 17, MaxCells: 6000000}, // geohash 7
}

var s2Polygons map[interface{}](*s2.Polygon)
var polygonConversionDuration float64

var statFile *os.File

func checkError(err error) {
	if err != nil {
		panic(err)
	}
}

func statFileInit() {
	var err error
	statFile, err = os.OpenFile("./out/stats.csv", os.O_WRONLY | os.O_CREATE | os.O_TRUNC, 0644)
	checkError(err)

	_, err = statFile.Write([]byte("LEVEL,TIME_SEC,LENGTH,FILE_SIZE_KB\n"))
	checkError(err)
}

func statFileWrite(level int, time float64, length int, size float64) {
	_, err := statFile.Write([]byte(fmt.Sprintf("%v,%v,%v,%v\n", level, polygonConversionDuration + time, length, size)))
	checkError(err)
}

// Convert [][][2] to array of s2 Loops
func geojsonLoopsToS2Loops(geomLoops [][][]float64) []*s2.Loop {
	var loops []*s2.Loop
	for _, geomLoop := range geomLoops {
		var points []s2.Point
		for _, coordinate := range geomLoop {
			points = append(points, s2.PointFromLatLng(s2.LatLngFromDegrees(coordinate[1], coordinate[0])))
		}
		loops = append(loops, s2.LoopFromPoints(points))
	}
	return loops
}

// Convert geometry object of geojson to s2 Polygon
func geometryToS2Polygon(geom *geojson.Geometry) (*s2.Polygon, error) {
	if geom.IsPolygon() {
		loops := geojsonLoopsToS2Loops(geom.Polygon)
		return s2.PolygonFromLoops(loops), nil
	} else if geom.IsMultiPolygon() {
		var combinedLoops []*s2.Loop
		for i := range geom.MultiPolygon {
			loops := geojsonLoopsToS2Loops(geom.MultiPolygon[i])
			for _, loop := range loops {
				combinedLoops = append(combinedLoops, loop)
			}
		}
		return s2.PolygonFromLoops(combinedLoops), nil
	}
	return nil, errors.New("Geometry is not polygon")
}

// cover region of defined polygon, to be called concurrently with sync.WaitGroup
func cover(
	polygon *s2.Polygon,
	featureProperties map[string]interface{},
	regionCoverer s2.RegionCoverer,
	waitGroup *sync.WaitGroup,
	resultChannel chan *coverResult,
) {
	result := coverResult{}

	_ = os.Mkdir(fmt.Sprintf("./out/%v", regionCoverer.MaxLevel), 0644)

	filePath := fmt.Sprintf("./out/%v/%v.s2cells", regionCoverer.MaxLevel, featureProperties["codigo"])

	file, err := os.OpenFile(filePath, os.O_CREATE | os.O_WRONLY | os.O_TRUNC, 0644)
	if err != nil {
		fmt.Println("  Error, cannot open file for ", featureProperties["texto"], " - ", err)
		waitGroup.Done()
		return
	}
	
	cellUnion := regionCoverer.Covering(s2.Region(polygon))
	result.Length = len(cellUnion)

	for _, cell := range cellUnion {
		if _, err := file.Write([]byte(cell.ToToken() + "\n")); err != nil {
			fmt.Println("  Error, cannot write file for ", featureProperties["texto"], " - ", err)
			waitGroup.Done()
			return
		}
	}

	file.Close()

	fileStat, err := os.Stat(filePath)
	if err != nil {
		fmt.Println("  Error, cannot read stat file ", filePath)
		waitGroup.Done()
		return
	}
	result.Size = float64(fileStat.Size()) / 1024.0

	fmt.Printf("  %v - OK\n", featureProperties["texto"])
	resultChannel <- &result
	waitGroup.Done()
}

// cover all features in one level
func coverLevel(featureCollection *geojson.FeatureCollection, regionCoverer s2.RegionCoverer) (length int, size float64) {
	resultChannel := make(chan *coverResult, len(featureCollection.Features))
	length, size = 0, float64(0)

	waitGroup := sync.WaitGroup{}
	waitGroup.Add(len(featureCollection.Features))
	for _, feature := range featureCollection.Features {
		go cover(s2Polygons[feature.Properties["codigo"]], feature.Properties, regionCoverer, &waitGroup, resultChannel)
	}
	waitGroup.Wait()

	close(resultChannel)
	for coverResult := range resultChannel {
		length += coverResult.Length
		size += coverResult.Size
	}
	fmt.Println("Level Success")

	return length, size
}

func main() {
	data, err := ioutil.ReadFile("./data/comunidades_autonomas.geojson")
	checkError(err)

	// read and decode geojson from file
	featureCollection, err := geojson.UnmarshalFeatureCollection(data)
	checkError(err)

	statFileInit()

	// convert all geojson geometries to be s2 polygon and store in s2Polygons map
	startTime := time.Now()
	s2Polygons = make(map[interface{}]*s2.Polygon)
	for _, feature := range featureCollection.Features {
		s2Polygons[feature.Properties["codigo"]], err = geometryToS2Polygon(feature.Geometry)
		checkError(err)
	}
	polygonConversionDuration = time.Since(startTime).Seconds()

	// iterate over different regionCoverers and convert all polygons in different levels
	for _, regionCoverer := range regionCoverers {
		fmt.Printf("Level %v - %v\n", regionCoverer.MinLevel, regionCoverer.MaxLevel)
		startTime = time.Now()
		length, size := coverLevel(featureCollection, regionCoverer)
		statFileWrite(regionCoverer.MaxLevel, time.Since(startTime).Seconds(), length, size)
	}

	fmt.Println("Exited")
}
