document.addEventListener("DOMContentLoaded", () => {
    const maps = document.querySelectorAll(".map")

    if (maps.length === 0) return

    maps.forEach(el => {
        const lat = parseFloat(el.dataset.lat)
        const lon = parseFloat(el.dataset.lon)
        const name = el.dataset.name
        const address = el.dataset.address

        const map = L.map(el.id).setView([lat, lon], 15)

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        L.marker([lat, lon]).addTo(map)
            .bindPopup(`<b>${name}</b><br>${address}`)
            .openPopup();
    })
})