require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const Person = require('./models/persons')
const app = express()
app.use(express.json())
app.use(cors())
app.use(express.static('build'))
morgan.token('requestBody', function (req, res) { return JSON.stringify(req.body) })

app.use(
  morgan(function (tokens, req, res) {
    return [
      tokens.method(req, res),
      tokens.url(req, res),
      tokens.status(req, res),
      tokens.res(req, res, 'content-length'), '-',
      tokens['response-time'](req, res), 'ms',
      tokens['requestBody'](req,res)
    ].join(' ')
  }))


app.get('/api/persons', (req,res) => {
  Person.find({}).then(response => {
    res.json(response)
  })
})
app.post('/api/persons',(req,res) => {
  const person = req.body
  if(!person.number || !person.name){
    res.json({ error:'Name and phonenumber must be included in the request' }).status(401).end()
  }
  Person.find({}).then(persons => {
    if(persons.find(p => p.name === person.name)){
      res.json({ error: 'name must be unique' }).status(401).end()
    }
    else{
      const personMongo = new Person({ name: person.name,number: person.number })
      personMongo.save().then(response => {
        res.json(response).status(201).end()
      }).catch(error => {
        if(error.errors){
          const errorFields = Object.keys(error.errors)
          const errorText = errorFields.reduce((errorText,errorField) => `${errorText} ${error.errors[errorField].properties.message}`,'')
          res.status(401).json({ error: errorText }).end()
        }
        else{
          res.status(500).json().end()
        }

      })


    }
  }).catch(error => {
    console.log(error)
    res.status(500).end()
  })
})
app.put('/api/persons/:id',(req,res) => {
  const person = req.body
  if(!person.number || !person.name){
    res.json({ error:'Name and phonenumber must be included in the request' }).status(401).end()
  }
  else{
    Person.findByIdAndUpdate(req.params.id,person).then(response => {
      res.json(response).status(201).end()
    }).catch(error => {
      if(error.errors){
        const errorFields = Object.keys(error.errors)
        const errorText = errorFields.reduce((errorText,errorField) => `${errorText} ${error.errors[errorField].properties.message}`,'')
        res.status(401).json({ error: errorText }).end()
      }
      else{
        res.status(500).json().end()
      }
    })
  }
})

app.delete('/api/persons/:id', (req,res) => {
  Person.findById(req.params.id).then(person => {
    if(person){
      Person.deleteOne({ id:req.params.id }).then(response => {
        console.log(response)
        res.status(204).end()
      }).catch(error => {
        console.log(error)
        res.status(500).end()
      })
    }
    else{
      res.status(404).end()
    }
  }).catch(error => {
    console.log(error)
    res.status(500).end()
  })
})
app.get('/api/persons/:id', (req,res) => {
  Person.findById(req.params.id).then(person => {
    if(person){
      res.json(person)
    }
    else{
      res.status(404).end()
    }
  }).catch(error => {
    console.log(error)
    res.status(500).end()
  })
})

app.get('/info', (req,res) => {
  Person.find({}).then(persons => {
    res.send(`<p>Phonebook has info for ${persons.length} people.</p><p>${new Date()}</p>`)
  }).catch(error => {
    console.log(error)
    res.status(500).end()
  })
})


const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
