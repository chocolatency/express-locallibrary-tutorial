var Genre = require('../models/genre');
var Book = require('../models/book');

var async = require('async');

const { body, validationResult } = require("express-validator");

// Display list of all Genre.
exports.genre_list = function(req, res, next) {
    
    Genre.find()
     .sort({name: 1})
     .exec(function (err, list_genres) {
        if (err) { next(err) }
        // Successful, so render
        res.render('genre_list', {
            title: 'Genre List',
            genre_list: list_genres,
        });
     });
};

// Display detail page for a specific Genre.
exports.genre_detail = function(req, res, next) {
    
    async.parallel({
        genre(callback) {
            Genre.findById(req.params.id).exec(callback);
        },
        genre_books(callback) {
            Book.find({ genre: req.params.id}).exec(callback)
        }
    },
    (err, results) => {
        if (err) {
            return next(err);
        }

        if (results.genre == null) {
            var error = new Error('Genre not found');
            error.status = 404;
            return next(err);
        }
        // Successful, so render.

        res.render("genre_detail", {
            title: 'Genre Detail',
            genre: results.genre,
            genre_books: results.genre_books,
        });
    });
};

// Display Genre create form on GET.
exports.genre_create_get = function(req, res) {
    res.render('genre_form', {
        title: 'Create Gener',
    });
};

// Handle Genre create on POST.
exports.genre_create_post = [
    // Validate and sanitize the name field.
    body("name", "Genre name required").trim().isLength({ min: 1 }).escape(),
    (req, res, next) => {
        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a genre object with escaped and trimmed data.
        const genre = new Genre({ name: req.body.name });

            console.log(errors, errors.isEmpty());
        if (!errors.isEmpty()) {

            // There are errors. Render the form again with sanitized values/error messages.
            res.render("genre_form", {
                title: "Create Genre",
                genre,
                errors: errors.array(),
            });
            return;
        } else {
            // Data from form is valid.
            // Check the datebase if Genre already exists.
            Genre.findOne({ name: req.body.name }).exec((err, found_genre) => {
                if (err) {
                    return next(err);
                }

                if (found_genre) {
                    // Genre exists, redirect to its detail page.
                    res.redirect(found_genre.url);
                } else {
                    genre.save((err) => {
                        if (err) {
                            return next(err);
                        }

                        // Genre saved. Redirect to genre detail page.
                        res.redirect(genre.url);
                    });
                }
            });
        }
    },
];

// Display Genre delete form on GET.
exports.genre_delete_get = function(req, res, next) {
    const { id } = req.params;

    async.parallel({
        books(callback) {
            Book.find({ genre: { $in: id } }).exec(callback);
        },
        genre(callback) {
            Genre.findOne({ _id: id }).exec(callback);
        }
    },
    (err, results) => {
        if (err) {
            return next(err);
        }

        res.render('genre_delete', {
            title: "Delete Genre",
            genre: results.genre,
            books: results.books,
        });
    });
};

// Handle Genre delete on POST.
exports.genre_delete_post = function(req, res, next) {
    const { id } = req.params;

    if (id) {
        async.parallel({
            books(callback) {
                Book.find({ genre: { $in: id } }).exec(callback);
            },
            genre(callback) {
                Genre.findOne({ _id: id }).exec(callback);
            }
        },
        (err, results) => {
            if (err) {
                return next(err);
            }

            if (results.books.length > 0) {
                res.render('genre_delete', {
                    title: 'Delete Genre',
                    books: results.books,
                    genre: results.genre,
                });

                return;
            }

            Genre.findOneAndDelete({ _id: id }).exec(function(err, deleted_genre) {
                if (err) {
                    return next(err);
                }

                res.redirect('/catalog/genres');
            });
        });
    } else {
        res.redirect('/catalog');
    }
};

// Display Genre update form on GET.
exports.genre_update_get = function(req, res, next) {
    Genre.findById(req.params.id).exec(function(err, found_genres) {
        if (err) {
            return next(err);
        }

        res.render('genre_form', {
            title: 'Update Genre',
            genre: found_genres,
        })
    });
};

// Handle Genre update on POST.
exports.genre_update_post = [
    body('name', 'This field should not be empty.')
     .trim()
     .isLength({ min: 1})
     .escape(),

    (req, res, next) => {
        const errors = validationResult(req);

        const genre = new Genre({
            name: req.body.name,
            _id: req.params.id,
        });

        if (!errors.isEmpty()) {

            res.render('genre_form', {
                title: 'Update genre',
                genre: genre,
                errors: errors.array(),
            });
             return;
        }

        Genre.findByIdAndUpdate(req.params.id, genre, function(err, updated_genre) {
            if (err) {
                return next(err);
            }

            res.redirect(genre.url);
        });
    }
];
