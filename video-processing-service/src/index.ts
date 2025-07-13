import express from "express";
import { setupDirectories, downloadRawVideo, uploadProcessedVideo, convertVideo, deleteRawVideo, deleteProcessedVideo } from "./storage";

import { GoogleAuth } from 'google-auth-library';
async function printActiveIdentity() {
    const auth = new GoogleAuth();
    const client = await auth.getClient();
    const projectId = await auth.getProjectId();
    
    // Try to get the service account email from the client
    let email = 'UNKNOWN';
    try {
        // For service accounts, we can access the email through the client's credentials
        if ('credentials' in client && client.credentials && 'client_email' in client.credentials) {
            email = (client.credentials as any).client_email;
        }
    } catch (error) {
        console.log('Could not determine service account email');
    }
    
    console.log('▶️ Authenticated as:', email);
    console.log('▶️ Project ID:', projectId);
  }
  printActiveIdentity();

// Set the path to ffmpeg binary explicitly for WSL environment
// ffmpeg.setFfmpegPath('/usr/bin/ffmpeg');
setupDirectories();
const app = express();
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Hello World");
});

app.post("/process-video", async (req, res) => {
    // Get the bucket and file name from the Cloud Pub/Sub message
    let data;
    try{
        const message = Buffer.from(req.body.message.data, "base64").toString("utf-8");
        data = JSON.parse(message);
        if (!data.name){
            throw new Error("Invalid message payload received");
        }
    }catch(error){
        console.error(error);
        return res.status(400).send("Bad Request: invalid message payload received");
    }
    
    const inputFileName = data.name;
    const outputFileName = `processed-${inputFileName}`;

    await downloadRawVideo(inputFileName);

    // process the video
    try{
        await convertVideo(inputFileName, outputFileName);
    }catch(error){
        await Promise.all([
            deleteRawVideo(inputFileName),
            deleteProcessedVideo(outputFileName),
        ]);
        console.error(error);
        return res.status(500).send("Internal Server Error: Failed to process video");
    }

    await uploadProcessedVideo(outputFileName);
    await Promise.all([
        deleteRawVideo(inputFileName),
        deleteProcessedVideo(outputFileName),
    ]);

    res.status(200).send("Processing completed successfully");

});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port} at http://localhost:${port}`);
});