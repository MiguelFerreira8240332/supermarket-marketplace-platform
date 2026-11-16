// utils/errorHandler.js


const renderError = (req, res, status, message, err = null) => {
    if (err) console.log(err)
    return res.status(status).render('error', {
        message: message,
        error: { 
            status: status, 
            stack: err ? err.stack : null
        },
        goback: req.get('Referer') || '/'
    });
};

module.exports = { renderError };