
const express = require('express');
const cors = require('cors');
const app = express()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000
require('dotenv').config()

app.use(cors())
app.use(express.json())





const uri = `mongodb+srv://${process.env.job_user}:${process.env.job_pass}@cluster0.xlnwpku.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        // Send a ping to confirm a successful connection
        const jobCollections = client.db('jobPortal').collection('jobs')
        const jobApplication = client.db('jobPortal').collection('job-application')

        app.post('/jobs', async (req, res) => {
            const newJobs = req.body;
            const result = await jobCollections.insertOne(newJobs)
            res.send(result)
        })

        app.get('/jobs', async (req, res) => {
            const email = req.query.email
            let query = {};
            if (email) {
                query = { hr_email: email }
            }
            const cursor = jobCollections.find(query)
            const result = await cursor.toArray()
            res.send(result)
        })

        app.get('/jobs/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await jobCollections.findOne(query)
            res.send(result)
        })

        app.post('/job-application', async (req, res) => {
            const jobs = req.body;
            const result = await jobApplication.insertOne(jobs)

            // count jobs applications
            const id = jobs.job_id
            const query = { _id: new ObjectId(id) }
            const job = await jobCollections.findOne(query)
            console.log(job);

            let nwCount = 0
            if (job.applicationCount) {
                nwCount = job.applicationCount + 1
            }
            else {
                nwCount = 1
            }

            const filter = { _id: new ObjectId(id) }
            const updatedDoc = {
                $set: {
                    applicationCount: nwCount
                }
            }
            const updatedCount = await jobCollections.updateOne(filter, updatedDoc)
            res.send(result)
        })

        app.get('/job-application/jobs/:job_id', async (req, res) => {
            const jobId = req.params.job_id
            const query = { job_id: jobId }
            const result = await jobApplication.find(query).toArray()
            res.send(result)
        })

        app.patch('/job-application/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const data = req.body;
            const updatedDoc = {
                $set: {
                    status: data.status
                }
            }
            const result = await jobApplication.updateOne(filter, updatedDoc)
            res.send(result)
        })

        app.get('/job-application', async (req, res) => {
            const email = req.query.email;
            const query = { user_email: email };
            const result = await jobApplication.find(query).toArray()


            for (const application of result) {
                console.log(application.job_id)
                const query1 = { _id: new ObjectId(application.job_id) };
                const job = await jobCollections.findOne(query1)

                if (job) {
                    application.title = job.title;
                    application.company = job.company;
                }
            }
            res.send(result)
        })

        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('JOB PORTAL SERVER IS RUNNING')
})

app.listen(port, () => {
    console.log(`job portal server is running on port ${port}`);
})