const darkToggle = document.getElementById('dark-toggle');

if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-mode');
    darkToggle.innerText = 'Light Mode';
}

darkToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    
    if (document.body.classList.contains('dark-mode')) {
        darkToggle.innerText = 'Light Mode';
        localStorage.setItem('theme', 'dark'); 
    } else {
        darkToggle.innerText = 'Dark Mode';
        localStorage.setItem('theme', 'light'); 
    }

});
