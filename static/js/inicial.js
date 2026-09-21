
function irAgendamento(e) {
    e.preventDefault(); // impede o href padrão

    const user = sessionStorage.getItem('una_user');

    if (user) {
        window.location.href = 'agendamento.html';
    } else {
        window.location.href = 'index_agenda.html';
    }
}
