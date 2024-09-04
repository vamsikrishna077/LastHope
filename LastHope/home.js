
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const passwordHash = require('password-hash');
const bodyParser = require('body-parser');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('./key.json');

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(express.static('public'));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.render(__dirname + '/public/donarsignup');
});

app.get('/login', (req, res) => {
  res.render(__dirname + '/public/donarlogin.ejs');
});

app.get('/home', (req, res) => {
  
allDonationData=[];
  res.render('home.ejs',{ allDonationData});
});
app.get('/donarsignup', (req, res) => {
  res.render(__dirname + '/public/donarsignup');
});
app.get('/task1', (req, res) => {
  res.render(__dirname + '/public/task1');
});
app.post('/donorsubmit', function (req, res) {
  var hashedPassword = passwordHash.generate(req.body.password);
  db.collection('signup')
    .where('Email', '==', req.body.email)
    .get()
    .then((docs) => {
      if (docs.size > 0) {
        res.send('Hey, the account already exists in the database');
      } else {
        db.collection('signup')
          .add({
            FirstName: req.body.firstName,
            Email: req.body.email,
            Phone: req.body.mobile,
            Address: req.body.address,
            PinCode: req.body.pincode,
            State: req.body.state,
            PanNumber: req.body.panNo,
            Password: hashedPassword,
          })
          .then(() => {
            res.render(__dirname + '/public/donarlogin' );
          });
      }
    });
});

app.post('/donorlogin', function (req, res) {
  var email = req.body.email;
  var password = req.body.password;
  var dataPres = false;
  allDonationData = [];
  db.collection('signup')
    .get()
    .then((docs) => {
      docs.forEach((doc) => {
        if (email == doc.data().Email && passwordHash.verify(password, doc.data().Password)) {
          dataPres = true;
        }
      });
      
      if (dataPres) {
        res.render(__dirname + '/views/home',{allDonationData});
      } else {
        res.send('Data not present in Firebase, please login');
      }
    });
});

app.post('/detailsSubmit', function (req, res) {
  const name = req.body.name || '';
  const cause_id = req.body.cause_id || '';
  const donationAmount = req.body.donationAmount || '';
  const PanNo = req.body.PanNo || '';
  const image = req.body.image || '';
  const ScreenShot = req.body.ScreenShot || '';
  const kept_confidential = req.body.kept_confidential || false;
  const hereby_declare = req.body.hereby_declare || false;
  const Receipt80g = req.body.Receipt80g || false;

  const donationData = {
    name: name,
    cause_id: cause_id,
    donationAmount: donationAmount,
    PanNo: PanNo,
    image: image,
    ScreenShot: ScreenShot,
    kept_confidential: kept_confidential,
    hereby_declare: hereby_declare,
    Receipt80g: Receipt80g,
  };

  db.collection('donate')
    .add(donationData)
    .then((docRef) => {
      return db.collection('donate').get();
    })
    .then((querySnapshot) => {
      const allDonationData = [];
      querySnapshot.forEach((doc) => {
        const donation = doc.data();
        allDonationData.push(donation);
      });
      res.render('home', { allDonationData: allDonationData });
    })
    .catch((error) => {
      res.redirect('/error');
    });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
