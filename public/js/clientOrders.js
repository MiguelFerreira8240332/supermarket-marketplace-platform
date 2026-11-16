document.addEventListener('DOMContentLoaded', () => {

    const users = JSON.parse(
        document.getElementById('users-data').dataset.users
    );

    const input = document.getElementById('clientSearch');
    const select = document.getElementById('clientSelect');

    updateSelect(users);

    input.addEventListener('input', function () {
        const value = this.value.toLowerCase();

        const filtered = users.filter(u =>
            (u.email && u.email.toLowerCase().includes(value)) ||
            (u.phoneNumber && u.phoneNumber.includes(value))
        );

        updateSelect(filtered);
    });

    function updateSelect(list) {
        select.innerHTML = "";

        list.forEach(u => {
            const option = document.createElement("option");
            option.value = u._id;
            option.text = u.name + " (" + (u.phoneNumber || u.email) + ")";
            select.appendChild(option);
        });
    }

    select.addEventListener('change', function () {
        document.getElementById('clientId').value = this.value;
    });
    

    async function createClient() {
    const data = {
        name: document.getElementById('modalName').value,
        email: document.getElementById('modalEmail').value,
        phoneNumber: document.getElementById('modalPhone').value,
        password: "123456"
    };

    try {
        const res = await fetch('/users/findOrCreate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const user = await res.json();

        if (user && user._id) {
            document.getElementById('clientId').value = user._id;
            document.getElementById('clientSearch').value = user.name;

            bootstrap.Modal.getInstance(document.getElementById('clientModal')).hide();

            alert("Cliente criado!");
        }

    } catch {
        alert("Erro ao criar cliente");
    }
}

});