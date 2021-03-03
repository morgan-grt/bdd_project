const express = require('express')
const app = express();
const path = require("path");
const port = 80
const hostname = '0.0.0.0';

// Static Files
app.use(express.static('ui'));
// Specific folder example
app.use('/css', express.static(path.join(__dirname, 'ui/css')));
app.use('/js', express.static(path.join(__dirname, 'ui/js')));
app.use('/img', express.static(path.join(__dirname, 'ui/img')));

// Set View's
app.set('views', path.join(__dirname, "ui"));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

// Navigation
app.get('/', (req, res) => {
    res.render('index');
});

app.get('/table', (req, res) => {
	res.render('table');
});

app.get('/graph', (req, res) => {
	res.render('graph');
});

app.listen(port, hostname, () => console.info(`🚀 App listening on port ${port}`));