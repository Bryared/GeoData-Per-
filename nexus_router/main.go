package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"
)

// Structural representant of a logistics and disaster coordinate payload
type DisasterPayload struct {
	EventID   string    `json:"event_id"`
	EventType string    `json:"event_type"` // "HUAICO", "SISMO", "INCENDIO"
	Severity  int       `json:"severity"`   // 1 to 5
	Latitude  float64   `json:"latitude"`
	Longitude float64   `json:"longitude"`
	Timestamp time.Time `json:"timestamp"`
}

// Response routing package return
type RoutingResponse struct {
	Status        string    `json:"status"`
	OptimalRoute  string    `json:"optimal_route"`
	SolverTimeMs  int64     `json:"solver_time_ms"`
	ReroutedPaths int       `json:"rerouted_paths"`
	Message       string    `json:"message"`
}

func main() {
	// Initialize local concurrent roads graph memory
	InitializeRoadsGraph()

	http.HandleFunc("/api/v1/nexus/reroute", handleReroute)
	http.HandleFunc("/api/v1/nexus/status", handleStatus)

	port := ":9000"
	fmt.Printf("🐹 [nexus-router] Golang vial routing service active on port %s\n", port)
	if err := http.ListenAndServe(port, nil); err != nil {
		log.Fatalf("Critical service crash: %v", err)
	}
}

func handleStatus(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":          "ONLINE",
		"engine":          "Golang multithreading goroutines v1.22",
		"loaded_edges":    1420542,
		"graph_srid":      4326,
		"dijkstra_status": "STANDBY",
	})
}

func handleReroute(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var payload DisasterPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "Bad request payload: "+err.Error(), http.StatusBadRequest)
		return
	}

	startTimer := time.Now()

	// ⚡ CONCURRENCY SIMULATION: Solve multi-threaded road intersections via Goroutines
	resultsChan := make(chan int)
	go func() {
		// Simulates A* / Dijkstra calculation on Go's RAM Graph memory
		reroutedCount := SolverReroute(payload.Latitude, payload.Longitude, payload.Severity)
		resultsChan <- reroutedCount
	}()

	reroutedPaths := <-resultsChan
	elapsedTime := time.Since(startTimer).Nanoseconds() / 1e6 // milliseconds

	response := RoutingResponse{
		Status:        "SUCCESS",
		OptimalRoute:  " Trujillo ──► Callejón de Huaylas (Huaraz) ──► Canta ──► Lima Hub",
		SolverTimeMs:  elapsedTime,
		ReroutedPaths: reroutedPaths,
		Message:       fmt.Sprintf("Huaico in Casma detected. Panamericana blocked. Golang solver recalculated routes in %d ms using Dijkstra.", elapsedTime),
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}
