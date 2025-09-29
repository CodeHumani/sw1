document.getElementById('create-room-form').addEventListener('submit', async function (event) {
    event.preventDefault();
    const title = document.getElementById('title').value;
    const xml = document.getElementById('xml').value;
    const description = document.getElementById('description').value;
    const roomData = {
        title: title,
        xml: xml,
        description: description
    };
    try {
        const response = await fetch(`${API_URL}/apis/sala/`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(roomData)
        });
        if (response.ok) {
            const data = await response.json();
            alert('Sala creada exitosamente');
            window.location.href = './dashboard.html';
        } else {
            const errorData = await response.json();
            alert('Error al crear sala: ' + errorData.message);
        }
    } catch (error) {
        console.error('Error en la solicitud:', error);
        alert('Error en la solicitud: ' + error.message);
    }
});
