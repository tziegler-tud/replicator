function webErrorHandler(err, req, res, next) {
    if (typeof (err) === 'string') {
        // custom application error
        return res.status(400).json({ message: err });
    }

    if (err.name === 'ValidationError') {
        // mongoose validation error
        return res.status(400).json({ message: err.message });
    }

    if (err.name === 'UnauthorizedError') {
        // jwt authentication error
        return res.status(401).json({ message: 'Invalid Token' });
    }

    if (err.name === 'ForbiddenError' || err.status === 403) {
        // trying to access protected resource
        return res.status(403).render("unisams/error/403", {
            title: "403 - Forbidden.",
            error: err,
            status: err.status,
            message: "Error 403: Insuffiecient access rights."
        });
    }

    if (err.name === 'NotFoundError' || err.status === 404) {
        // trying to access protected resource
        return res.status(404).render("unisams/error/404", {
            title: "404 - Page not found.",
            error: err,
            message: "Error 404: Page not found."
        });
    }

    // default to 500 server error
    res.status(err.status || 500);

    // // render the error page
    res.render('unisams/error/error', {
        title: "500 - Internal Server error",
        error: err,
    });
}

function apiErrorHandler(err, req, res, next) {
    if (typeof (err) === 'string') {
        // custom application error
        return res.status(400).json({message: err});
    }

    if (err.name === 'ValidationError') {
        // mongoose validation error
        return res.status(400).json({message: err.message});
    }

    if (err.name === 'UnauthorizedError') {
        // jwt authentication error
        return res.status(401).json({message: 'Invalid Token'});
    }

    if (err.name === 'ForbiddenError' || err.status === 403) {
        // trying to access protected resource
        return res.status(403).json({message: err.message});
    }

    if (err.name === 'NotFoundError' || err.status === 404) {
        // not found
        return res.status(404).json(err);
    }

    // default to 500 server error
    res.status(err.status || 500).json({message: err.message});
}

module.exports = {
    webErrorHandler,
    apiErrorHandler};