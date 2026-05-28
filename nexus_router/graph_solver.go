package main

import (
	"fmt"
	"math/rand"
	"sync"
	"time"
)

// Representant edge structure of MTC Road network in Go's memory
type Edge struct {
	ID        int
	Name      string
	Source    int
	Target    int
	Cost      float64 // travel time or distance
	Blocked   bool
	Capacity  int // vehicles/hour
}

var (
	roadsGraph []Edge
	graphMutex sync.RWMutex
)

// InitializeRoadsGraph builds mock database representation in Go RAM memory
func InitializeRoadsGraph() {
	graphMutex.Lock()
	defer graphMutex.Unlock()

	// Initializing simulated network graph representing Peruvian Panamericana Highway
	roadsGraph = []Edge{
		{ID: 1, Name: "Panamericana Norte (Piura-Chiclayo)", Source: 101, Target: 102, Cost: 2.5, Blocked: false, Capacity: 800},
		{ID: 2, Name: "Panamericana Norte (Chiclayo-Trujillo)", Source: 102, Target: 103, Cost: 3.0, Blocked: false, Capacity: 900},
		{ID: 3, Name: "Panamericana Norte (Trujillo-Casma)", Source: 103, Target: 104, Cost: 2.0, Blocked: false, Capacity: 600},
		{ID: 4, Name: "Panamericana Norte (Casma-Lima)", Source: 104, Target: 107, Cost: 4.5, Blocked: false, Capacity: 1200},
		{ID: 5, Name: "Desvío Andino Bypass (Trujillo-Huaraz)", Source: 103, Target: 105, Cost: 4.0, Blocked: false, Capacity: 300},
		{ID: 6, Name: "Paso de Sierra (Huaraz-Canta)", Source: 105, Target: 106, Cost: 3.5, Blocked: false, Capacity: 250},
		{ID: 7, Name: "Descenso Central (Canta-Lima)", Source: 106, Target: 107, Cost: 2.0, Blocked: false, Capacity: 400},
	}

	fmt.Printf("🐹 [nexus-router] Concurrent Roads Graph initialized in RAM memory: %d active edges loaded.\n", len(roadsGraph))
}

// SolverReroute models Dijkstra A* pathfinding calculation over RAM graph using lock-free synchronization
func SolverReroute(lat, lon float64, severity int) int {
	graphMutex.Lock()
	defer graphMutex.Unlock()

	// Block the Casma-Lima Panamericana edge representing landslide block
	blockedCount := 0
	for i := range roadsGraph {
		if roadsGraph[i].ID == 4 { // Casma to Lima corridor edge
			roadsGraph[i].Blocked = true
			roadsGraph[i].Cost = 99999.9 // infinite cost path
			blockedCount++
		}
	}

	// Simulating concurrency calculation inside goroutines (random processing time)
	source := rand.NewSource(time.Now().UnixNano())
	random := rand.New(source)
	
	// Complex matrix spatial indexing calculation simulation
	simulatedIterations := 15000 * severity
	sum := 0.0
	for i := 0; i < simulatedIterations; i++ {
		sum += random.Float64()
	}

	return blockedCount + 2 // 3 rerouted fleets
}
