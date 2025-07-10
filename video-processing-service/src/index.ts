import express from "express";
import { setupDirectories, downloadRawVideo, uploadProcessedVideo, convertVideo, deleteRawVideo, deleteProcessedVideo } from "./storage";

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