require('dotenv').config();

const PORT        = process.env.PORT || 8080;
const ENV         = process.env.ENV || "development";
const express     = require("express");
const cookieParser = require('cookie-parser');
const bodyParser  = require("body-parser");
const sass        = require("node-sass-middleware");
const app         = express();
//const bootstrap   = require('bootstrap');

const knexConfig  = require("./knexfile");
const knex        = require("knex")(knexConfig[ENV]);

const usersRoutes = require("./routes/users");

app.set("view engine", "ejs");
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/styles", sass({
  src: __dirname + "/styles",
  dest: __dirname + "/public/styles",
  debug: true,
  outputStyle: 'expanded'
}));
app.use(express.static("public"));

// Users JSON api
// app.use("/api/users", usersRoutes(knex));

// Home page
app.get("/", (req, res) => {
  res.render("index");
});

app.get('/a/:admin_digest', (req, res) => {
  // check and redirect
  // set a cookie
  knex('polls').where({admin_digest: req.params.admin_digest}).select('creator_id, id')
  .then(function(results) {
    if(results.length == 0){
      throw error;
    } else {
      const creator_id = results[0].creator_id;
      const id = results[0].id;
      req.cookies("creator_id", creator_id);
      res.redirect(`/polls/${id}/edit`);
    }
  });

});

app.post("/polls", (req, res) => {
  knex('polls').insert({}).returning('id').then(function(results) {
    console.log("Hi creating poll id:", results)
    let id = results[0];
    res.redirect(`/polls/${id}/edit`);
  });
});

app.get("/polls/:id/edit", (req, res) => {
  // fetch poll from db
  knex('polls').select('*').where({id: req.params.id})
  .then(function(results) {
    res.render("poll_edit", {poll: results[0]});
  });

});


/*
   let req_body = {poll: {title: "...",
         description: "...",
         choices: [ {title: "...",
                     description: "..."},
                    {title: "...",
                     description: "..."}
                     ]
         }}

*/

app.put("/polls/:id", (req, res) => {
  let poll_id = req.params.id
  // console.log(req.body[3]);
  knex('polls').where({id: poll_id}).update({title: req.body.poll.title,
                                             description: req.body.poll.description});
  knex('choices').where({poll_id: poll_id}).delete();

  for(choice of req.body.poll.choices) {
    knex('choices').insert({title: choice.title,
                             description: choice.description,
                             poll_id: poll_id});
  }
  res.json({status: "OK"})
});

app.get("/polls/:id", (req, res) => {
  res.render("poll_share");
});

app.get("/polls/:id/results", (req, res) => {
  res.render("poll_results");
});

app.get("/p/:participant_digest", (req, res) => {
  // check if digest correct // find which poll it correspdonds to
  // create a participant // set a cookie
    knex('polls').where({participant_digest: req.params.participant_digest})
    .select('participant_digest, id').then(function(results) {
      if(results.length == 0) {
        throw error;
      } else {
        knex('participants').insert({}).returning("id").then(function(results) {
          let participant_id = results[0];
          req.cookies("participant_id", participant_id);
          res.redirect(`/rank/${participant_id}`);
        });
      }
  });
});

app.get("/rank/:participant_id", (req, res) => {
  res.render("poll_taking");
});

app.post("/rank/:participant_id", (req, res) => {
  res.redirect("/rank/:participant_id/success");
});

app.get("/rank/:participant_id/success", (req, res) => {
  res.render("poll_success");
});

app.listen(PORT, () => {
  console.log("Example app listening on port " + PORT);
});
