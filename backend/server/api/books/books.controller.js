/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/books              ->  index
 * POST    /api/books              ->  create
 * GET     /api/books/:id          ->  show
 * PUT     /api/books/:id          ->  upsert
 * PATCH   /api/books/:id          ->  patch
 * DELETE  /api/books/:id          ->  destroy
 */

'use strict';

import jsonpatch from 'fast-json-patch';
import Books from './books.model';
import Journal from '../journal/journal.model';

function respondWithResult(res, statusCode) {
  statusCode = statusCode || 200;
  return function(entity) {
    if(entity) {
      return res.status(statusCode).json(entity);
    }
    return null;
  };
}

function patchUpdates(patches) {
  return function(entity) {
    try {
      jsonpatch.apply(entity, patches, /*validate*/ true);
    } catch(err) {
      return Promise.reject(err);
    }

    return entity.save();
  };
}

function removeEntity(res) {
  return function(entity) {
    if(entity) {
      return entity.remove()
        .then(() => {
          res.status(204).end();
        });
    }
  };
}

function handleEntityNotFound(res) {
  return function(entity) {
    if(!entity) {
      res.status(404).end();
      return null;
    }
    return entity;
  };
}

function handleError(res, statusCode) {
  statusCode = statusCode || 500;
  return function(err) {
    res.status(statusCode).send(err);
  };
}

// Gets a list of Bookss
export function index(req, res) {
  return Books.find().exec()
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Gets a journal AJAX
export function ajaxSearch(req, res){
  var regex = req.query.regex
  return Books.find({name:{'$regex' : regex, '$options' : 'i'}}).exec()
    .then(respondWithResult(res))
    .catch(handleError(res))
}

// Gets a single Books from the DB
export function show(req, res) {
  return Books.findById(req.params.id).exec()
    .then(handleEntityNotFound(res))
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Creates a new Books in the DB
export function create(req, res) {
  return Books.create(req.body)
    .then(respondWithResult(res, 201))
    .catch(handleError(res));
}

// Upserts the given Books in the DB at the specified ID
export function upsert(req, res) {
  if(req.body._id) {
    delete req.body._id;
  }
  return Books.findOneAndUpdate({_id: req.params.id}, req.body, {upsert: true, setDefaultsOnInsert: true, runValidators: true}).exec()

    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Updates an existing Books in the DB
export function patch(req, res) {
  if(req.body._id) {
    delete req.body._id;
  }
  return Books.findById(req.params.id).exec()
    .then(handleEntityNotFound(res))
    .then(patchUpdates(req.body))
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Deletes a Books from the DB
export function destroy(req, res) {
  return Books.findById(req.params.id).exec()
    .then(handleEntityNotFound(res))
    .then(removeEntity(res))
    .catch(handleError(res));
}

//databases content

export function contentSearchStatistics(req,res){
  var contentStatistics = [];
  var pdf = 0;
  var html = 0;
  Books.find({}).exec().then(function(result){
    for(var i = 0; i < result.length; i++){
      for(var j = 0; j < result[i].stats.length; j++){
        if(result[i]["stats"][j]["month"] == req.params.contentSearchMonth && result[i]["stats"][j]["year"] == req.params.contentSearchYear ){
            pdf += parseInt(result[i]["stats"][j]["ft_pdf"]);
            html += parseInt(result[i]["stats"][j]["ft_html"]);
          }
      }
    }
    var pdfResult = new Object();
    var htmlResult = new Object();
    pdfResult["label"] = "PDF";
    htmlResult["label"] = "Web";
    pdfResult["value"] = pdf;
    htmlResult["value"] = html;
    contentStatistics.push(pdfResult);
    contentStatistics.push(htmlResult);
    console.log(contentStatistics);
    res.send(contentStatistics);
  });
}

export function contentTypeSearchStatistics(req,res){
  var contentTypeSearchStatistics = [];
  var books = 0;
  var journals = 0;
  Books.find({}).exec().then(function(result){
    for(var i = 0; i < result.length; i++){
      for(var j = 0; j < result[i].stats.length; j++){
        if(result[i]["stats"][j]["month"] == req.params.contentTypeSearchMonth && result[i]["stats"][j]["year"] == req.params.contentTypeSearchYear ){
            books += parseInt(result[i]["stats"][j]["ft_total"]);
          }
      }
    }
    Journal.find({}).exec().then(function(result){
        for(var i = 0; i < result.length; i++){
          for(var j = 0; j < result[i].stats.length; j++){
            console.log(result[i]["stats"][j]["month"]);
            if(result[i]["stats"][j]["month"] == req.params.contentTypeSearchMonth /*&& result[i]["stats"][j]["year"] == req.params.contentTypeSearchYear */){
                journals += parseInt(result[i]["stats"][j]["ft_total"]);
              }
          }
        }
        var booksResult = new Object();
        var journalsResult = new Object();
        booksResult["label"] = "Libros";
        journalsResult["label"] = "Journals";
        booksResult["value"] = books;
        journalsResult["value"] = journals;
        contentTypeSearchStatistics.push(booksResult);
        contentTypeSearchStatistics.push(journalsResult);
        res.send(contentTypeSearchStatistics);
    });
  });
}