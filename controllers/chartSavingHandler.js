const async = require('async');
const Graph = require('../models/graphs');
const User = require('../models/User');

/**
 * POST /api/visualizer/save
 * Create a new graph save
 */
exports.saveGraph = (req, res) => {
  // They need to be signed in to save the graph
  if (!req.user) {
    res.send(JSON.stringify({'valid':'false', 'msg':'You have been signed out, please sign in again (in a different tab if you want to save your current progress).'}));
    return;
  }
  const errors = req.validationErrors();
  if (errors) {
    res.send(JSON.stringify({'valid':'false', 'msg':errors}));
    return;
  }

  // Information we are fetching from the save API call
  var graphConfig;
  var graphName;
  // Attempt to fetch information from request
  try {
    graphConfig = JSON.parse(req.body.graphConfig);
    graphName = req.body.name;
  }
  catch (err) {
    
    res.send(JSON.stringify({'valid':'false', 'msg':err.message}));
    return;
  }
  
  // Generate new graph object
  // Add name while building object if name is included in request body
  var newGraph;
  if (req.body.name != ""){
    newGraph = new Graph({
      name: graphName,
      author: req.user.id,
      config: JSON.stringify(graphConfig)
    });   
  } else {
    newGraph = new Graph({
      author: req.user.id,
      config: JSON.stringify(graphConfig)
    });    
  }

  // Double checking so that MongoDB does not spark duplicate key error while name is blank
  if (req.body.name == ""){
    delete newGraph.name;
  }

  // Ensure there is no graph with the same name
  Graph.findOne({name: graphName}, (err, existingGraph) => {
    
    // Graph with the same name is found 
    if (existingGraph&&(req.body.name != "")) {
      res.send(JSON.stringify({'valid':'false', 'msg':'Graph with custom ID already exists.'}));
      return;
    }

    // Save the new graph
    newGraph.save((err) => {
      if (err) { 
        if (err.code === 11000) {
          // Duplicate key error (Should not happen, any duplicate keys should be caught on line 60)
          res.send(JSON.stringify({'valid':'false', 'msg':err}));
          return;
        } else {
          res.send(JSON.stringify({'valid':'false', 'msg':err}));
          return;
        }
      } else {
        // Return the URL at which the new saved graph can be found
        var graphReferenceURL = (newGraph.name == undefined) ? newGraph._id : newGraph.name;
        res.send(JSON.stringify({'valid':'true', 'msg':graphReferenceURL})); 
        return;
      }
    });
  });
};

/**
 * GET /visualizer/:graphID
 * View saved graph
 */
exports.viewGraph = (req, res, next) => {
  if (req.params.graphID == ""){
    return res.redirect('/visualizer');
  }
  //Make sure graph ID is valid
  if (req.params.graphID.match(/^[0-9a-fA-F]{24}$/)) {
    Graph.findById(req.params.graphID, (err, graph) => {
      if (err) { 
        return next(err); 
      }
      if (!graph) { 
        // Try searcing by name if ID fails
        Graph.findOne({name: req.params.graphID}, (err, graph) => {
          if (err) { return next(err); }
          if (!graph) { 
            req.flash('errors', { msg: 'Invalid graph ID' });
            return res.redirect('/');
          }
          // Verify user before render
          res.render('visualizer', {
            title: 'View Graph',
            config: graph.config,
            graphId: "http://localhost:8080/visualizer/" + graph.name,
            authorString: "by " + graph.author
          });
        });      
      }
      // Verify user before render
      console.log(graph.config);
      res.render('visualizer', {
        title: 'View Graph',
        config: graph.config,
        graphId: "http://localhost:8080/visualizer/" + graph._id,
        authorString: "by " + graph.author
      });
    });
  // If graph ID is NOT valid
  } else {
    // Try to check if graph ID is actually a graph name
    Graph.findOne({name: req.params.graphID}, (err, graph) => {
      if (err) { 
        return next(err); 
      }
      // If no graph with name is found
      if (!graph) { 
        req.flash('errors', { msg: 'Invalid graph ID' });
        return res.redirect('/visualizer');
      }
      // If graph with name is found, return the graph
      res.render('visualizer', {
        title: 'View Saved Graph',
        config: graph.config,
        graphId: "http://localhost:8080/visualizer/" + graph.name,
        authorString: "by " + graph.author
      });
    });   
  }
};

/**
 * POST /api/visualizer/delete
 * Delete graph.
 * Not currently connected with front-end
 */
exports.deleteGraph = (req, res, next) => {
  if (!req.user) {
    return res.redirect('/');
  }
  // Find graph
  Graph.findById(req.body.name, (err, graph) => {
    if (err) { 
      return next(err); 
    }
    // Verify it is the author making the request
    graph.verifyAuthor(req.user.id, function(isAuthor){
      if (isAuthor) {
        // Delete the graph
        Graph.remove({_id: req.body.name}, (err) => {
          if (err) { return next(err); }
          req.logout();
          req.flash('info', { msg: 'Graph has been deleted.' });
          res.redirect('/');
        });
      } else {
        req.flash('errors', { msg: 'You are not the author of this graph.' });
        res.redirect('/');
       }
    });
  });
};