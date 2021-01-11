package main

import (
	"strings"

	"github.com/golang/geo/s2"
)

var encodingChars = []byte{
	'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 
	'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'a', 'b', 'c', 'd', 'e', 'f',
	'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v',
	'w', 'x', 'y', 'z', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '+', '/',
};

// S2CellIDToBase64 converts s2 CellID into base64 representation
func S2CellIDToBase64(cellID s2.CellID) string {
	base64 := make([]byte, 11)
	id := uint64(cellID)
	i := 0
	for shiftAmount := 58; shiftAmount > 0; shiftAmount -= 6 {
		level := (id >> shiftAmount) & 0x3F
		base64[i] = encodingChars[level]
		i++
	}
	base64[i] = encodingChars[int(id & 0x0F)]

	return strings.TrimRight(string(base64), "A")
}
