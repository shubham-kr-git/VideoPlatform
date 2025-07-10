import { Storage } from "@google-cloud/storage";
import fs from "fs";
import ffmpeg from "fluent-ffmpeg";

const storage = new Storage();

const rawVideoBucketName = "video-processing-service-raw-videos";
const processedVideoBucketName = "video-processing-service-processed-videos";

const localRawVideoPath = "./raw-videos";
const localProcessedVideoPath = "./processed-videos";

export function setupDirectories(){
    ensureDirectoryExistence(localRawVideoPath);
    ensureDirectoryExistence(localProcessedVideoPath);
}

export function convertVideo(rawVideoName: string, processedVideoName: string){
    return new Promise<void>((resolve, reject) => {
    ffmpeg(`${localRawVideoPath}/${rawVideoName}`)
    .outputOptions("-vf", "scale=-1:360")
    .on("end", () => {
        console.log("Processing completed successfully");
        resolve();
        // res.status(200).send("Processing completed successfully");
    })
    .on("error", (err) => {
        console.error(`Error processing video: ${err.message}`);
        reject(err);
        // res.status(500).send(`Internal Server Error: Failed to process video: ${err.message}`);
    })
    .save(`${localProcessedVideoPath}/${processedVideoName}`);
});
}

export async function downloadRawVideo(fileName: string){
    await storage
        .bucket(rawVideoBucketName)
        .file(fileName)
        .download({destination: `${localRawVideoPath}/${fileName}`});

    console.log(`gs://${rawVideoBucketName}/${fileName} downloaded to: ${localRawVideoPath}/${fileName}`);
}

export async function uploadProcessedVideo(fileName: string){
    const bucket = storage.bucket(processedVideoBucketName);
    await bucket.upload(`${localProcessedVideoPath}/${fileName}`, {
        destination: fileName,
    });

    console.log(`${localProcessedVideoPath}/${fileName} uploaded to: gs://${processedVideoBucketName}/${fileName}`);
    await bucket.file(fileName).makePublic();
}

export function deleteRawVideo(fileName: string){
    return deleteFile(`${localRawVideoPath}/${fileName}`);
}

export function deleteProcessedVideo(fileName: string){
    return deleteFile(`${localProcessedVideoPath}/${fileName}`);
}

function deleteFile(filePath: string): Promise<void>{
    return new Promise((resolve, reject) => {
        if (fs.existsSync(filePath)){
            fs.unlink(filePath, (err) => {
                if (err){
                    console.log(`Error deleting file: ${filePath}`, err);
                    reject(err);
                }else{
                    console.log(`File deleted: ${filePath}`);
                    resolve();
                }
            });
            
        }else{
            console.log(`File does not exist: ${filePath}`);
            resolve();
        }
    });
}

function ensureDirectoryExistence(dirPath: string){
    if (!fs.existsSync(dirPath)){
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`Directory created: ${dirPath}`);
    }
}