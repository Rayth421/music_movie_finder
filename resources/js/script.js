document.addEventListener("DOMContentLoaded", () => {
    const API_KEY = '0bfe047e19547a98b893894e7f251b32'; //TMDb API key
    const searchButton = document.querySelector("button");

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
            const response = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(song)}`);
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            
            const data = await response.json();

            if (data.results && data.results.length > 0) {
                results.innerHTML = data.results.map(movie => `<p>${movie.title} (${movie.release_date ? movie.release_date.split('-')[0] : 'N/A'})</p>`).join('');
            } else {
                results.innerHTML = "No results found.";
            }
        } catch (error) {
            console.error("Fetch error:", error);
            results.innerHTML = "Error fetching data. Please check your API or internet connection and try again later.";
        }
    });
});