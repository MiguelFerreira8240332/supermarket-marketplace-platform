let currentPage = 1

async function loadProducts(append = false) {

    if (!append) currentPage = 1

    var name = document.getElementById("name").value
    var category = document.getElementById("category").value
    var supermarket = document.getElementById("supermarket").value
    var container = document.getElementById("productsList")

    if (!container) return

    if (!append) container.innerHTML = "A carregar.."

    var context = document.body.dataset.context || "list"
    var sort = document.body.dataset.sort || "name"

    const url = 
    `/products/api?name=${name}&category=${category}&supermarket=${supermarket}&context=${context}&sort=${sort}&page=${currentPage}`

    try {
        const response = await fetch(url)
        const html = await response.text()

        if (append) {
            const oldbutton = container.querySelector('.load-more-btn')
            if (oldbutton) oldbutton.remove()
            container.innerHTML += html
        } else {
            container.innerHTML = html
        }

        if (document.body.dataset.context === "sale") {
            document.querySelectorAll('.add-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    addToCart(
                        this.dataset.id,
                        this.dataset.name,
                        this.dataset.price,
                        this.dataset.stock
                    )
                })
            })
        }

    } catch (err) {
        container.innerHTML = "Erro ao carregar produtos"
        console.error(err)
    }
}

function loadMore() {
    currentPage++
    loadProducts(true)
}