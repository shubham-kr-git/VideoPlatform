import express from "express";
import ffmpeg from "fluent-ffmpeg";

// Set the path to ffmpeg binary explicitly for WSL environment
// ffmpeg.setFfmpegPath('/usr/bin/ffmpeg');

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Hello World");
});

app.post("/process-video", (req, res) => {
    const inputFilePath = req.body.inputFilePath;
    const outputFilePath = req.body.outputFilePath;

    if (!inputFilePath){
        res.status(400).send("Bad Request: Input file path is required");
        return;
    }else if (!outputFilePath){
        res.status(400).send("Bad Request: Output file path is required");
        return;
    }

    ffmpeg(inputFilePath)
        .outputOptions("-vf", "scale=-1:360")
        .on("end", () => {
            res.status(200).send("Processing completed successfully");
        })
        .on("error", (err) => {
            console.error(`Error processing video: ${err.message}`);
            res.status(500).send(`Internal Server Error: Failed to process video: ${err.message}`);
        })
        .save(outputFilePath);
    
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port} at http://localhost:${port}`);
});