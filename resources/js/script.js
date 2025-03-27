document.addEventListener("DOMContentLoaded", () => {
    const API_KEY = '0bfe047e19547a98b893894e7f251b32'; //TMDb API key
    const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
    const searchButton = document.querySelector("button");
    const searchInput = document.getElementById("songName");
    const SPOTIFY_CLIENT_ID = 'your_client_id_here';
    const SPOTIFY_CLIENT_SECRET = 'your_client_secret_here';
    let SPOTIFY_ACCESS_TOKEN = ''; //Spotify access token

    // Allow search on Enter key press
    searchInput.addEventListener("keypress", (event) => {
        if (event.key === "Enter") {
            searchButton.click();
        }
    });

    searchButton.addEventListener("click", async () => {
        const song = document.getElementById("songName").value.trim();
        const artist = document.getElementById("artistName").value.trim();
        const resultsContainer = document.getElementById("resultsContainer");
        const results = document.getElementById("results");

        if (!song) {
            alert("Please enter a song name");
            return;
        }

        resultsContainer.style.display = "block";
        results.innerHTML = "Searching...";

        try {
            // Step 1: Search for song in MusicBrainz (TMDb)
            const movieList = await fetchMoviesBySong(song, artist);
            if (!movieList.length) {
                results.innerHTML = "No movies found for this song.";
                return;
            }

            // Step 2: Fetch producer, director, and soundtrack details
            const moviesWithDetails = await Promise.all(movieList.map(async (movie) => {
                const movieDetails = await fetchMovieDetails(movie.id);
                const soundtrackDetails = await fetchSpotifyDetails(song, artist);  // Or fetchLastFMDetails(song, artist);
                return { ...movie, ...movieDetails, ...soundtrackDetails };
            }));

            // Display results with movie images and additional details
            results.innerHTML = moviesWithDetails.map(movie => `
                <div style="margin-bottom: 20px;">
                    <img src="${movie.poster_path ? IMAGE_BASE_URL + movie.poster_path : 'https://via.placeholder.com/150'}" alt="${movie.title}" style="width: 150px; display: block; margin-bottom: 10px;">
                    <p><strong>${movie.title}</strong> (${movie.release_date ? movie.release_date.split('-')[0] : 'N/A'})</p>
                    <p><strong>Director:</strong> ${movie.director || 'Unknown'}</p>
                    <p><strong>Producer:</strong> ${movie.producer || 'Unknown'}</p>
                    <p><strong>Soundtrack:</strong> ${movie.album || 'Not Available'}</p>
                    <p><strong>Listen:</strong> <a href="${movie.trackUrl}" target="_blank">Spotify</a></p>
                </div>
            `).join('');
        } catch (error) {
            console.error("Error:", error);
            results.innerHTML = "Error fetching data. Please try again later.";
        }
    });

    // Fetch movie data from TMDb
    async function fetchMoviesBySong(song, artist) {
        const query = artist ? `${song} ${artist}` : song;
        const url = `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}`;

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error("TMDb API error");

            const data = await response.json();
            return data.results || [];
        } catch (error) {
            console.error("TMDb error:", error);
        }
        return [];
    }

    // Fetch movie details (including producer, director, etc.) from TMDb
    async function fetchMovieDetails(movieId) {
        const url = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${API_KEY}&append_to_response=credits`;

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error("TMDb movie details API error");

            const data = await response.json();
            const director = data.credits.crew.find(person => person.job === "Director");
            const producer = data.credits.crew.find(person => person.job === "Producer");

            return {
                director: director ? director.name : "Unknown",
                producer: producer ? producer.name : "Unknown"
            };
        } catch (error) {
            console.error("TMDb movie details error:", error);
        }
        return { director: "Unknown", producer: "Unknown" };
    }

    // Fetch soundtrack details (including album name) from Spotify
    async function getSpotifyAccessToken() {
        const url = 'https://accounts.spotify.com/api/token';
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + btoa(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET)
            },
            body: 'grant_type=client_credentials'
        });
    
        const data = await response.json();
        SPOTIFY_ACCESS_TOKEN = data.access_token; // Store the token
    }
});