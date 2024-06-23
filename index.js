import express from "express"
import axios from "axios"
import FormData from "form-data"
import multer from "multer"
import Blob from "buffer"
import fs from "fs"

const app = express()
const port = 3000

app.use(express.static("public"))
app.use(express.urlencoded({ extended: true }))
app.set("view engine", "ejs")

const apiURL = "https://api.trace.moe/search"

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        return cb(null, "./uploads")
    },
    filename: (req, file, cb) => {
        return cb(null, `${Date.now()}-${file.originalname}`)
    },
});
const upload = multer({ storage: storage })


app.get("/", (req, res) => {
    res.render("index.ejs")
})

app.post("/postURL", async (req, res) => {
    const ssURL = req.body.imageURL
    console.log(`${apiURL}?url=${ssURL}`)
    try {
        const result = await axios.post(`${apiURL}?url=${ssURL}`)
        console.log(JSON.stringify(result.data))
    } catch (error) {
        console.log(JSON.stringify(error.response.data))
    }
    res.render("index.ejs")
})

app.post("/uploadImage", upload.single("image"), async (req, res) => {
    try {
        if (!req.file) {
            throw new Error('No file uploaded')
        }
        console.log(req.file)
        const fileData = fs.readFileSync(`./uploads/${req.file.filename}`)
        const result = await axios.post(apiURL, fileData, {
            headers: {
                "Content-type": req.file.mimetype
            },
        })
        console.log(JSON.stringify(result.data))
        // const response = await fetch(apiURL, {
        //     method: "POST",
        //     body: fs.readFileSync(`./uploads/${req.file.filename}`),
        //     headers: {
        //         "Content-type": req.file.mimetype
        //     },
        // })
        // const result = await response.json()
        // console.log(JSON.stringify(result))
    } catch (error) {
        if (error.response) {
            console.error(JSON.stringify(error.response.data))
        } else {
            console.error(JSON.stringify(error.message))
        }
    }
    res.render("index.ejs")
})

app.listen(port, () => {
    console.log(`Server is listening on port ${port}`)
})
