import express, { query } from "express";
import axios from "axios";
import multer from "multer";
import fs from "fs";

const app = express();
const port = 3000;

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");

const apiURL = "https://api.trace.moe/search";

const aniListQuery = `
    query($id: Int) {
    Media(id: $id, type: ANIME) {
        id
        title {
            romaji
            english
            native
        }
        description
        startDate {
            year
            month
            day
        }
        endDate {
            year
            month
            day
        }
        coverImage {
            extraLarge
        }
        genres
        averageScore
        episodes
        status
    }
}
`;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    return cb(null, "./uploads");
  },
  filename: (req, file, cb) => {
    return cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage: storage });

app.get("/", (req, res) => {
  res.render("index.ejs");
});

app.post("/postURL", async (req, res) => {
  const ssURL = req.body.imageURL;
  console.log(`${apiURL}?url=${ssURL}`);
  try {
    const result = await axios.post(`${apiURL}?url=${ssURL}`);
    console.log(JSON.stringify(result.data));
    const episode = result.data.result[0].episode;
    const fromMin = Math.floor(result.data.result[0].from / 60);
    const fromSec = Math.floor(result.data.result[0].from % 60);

    const toMin = Math.floor(result.data.result[0].to / 60);
    const toSec = Math.floor(result.data.result[0].to % 60);

    const anilistID = result.data.result[0].anilist;
    // const anilistID =142329
    console.log(anilistID);

    const aniListResponse = await axios.post(
      "https://graphql.anilist.co",
      {
        query: aniListQuery,
        variables: { id: anilistID },
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    const animeDetail = aniListResponse.data.data.Media;
    // console.log(JSON.stringify(animeDetail))
    res.render("found.ejs", {
      videoSrc: result.data.result[0].video,
      ep: episode,
      fm: fromMin,
      fs: fromSec,
      tm: toMin,
      ts: toSec,
      animeDetails: animeDetail,
    });
  } catch (error) {
    if (error.response) {
      console.error(JSON.stringify(error.response.data));
    } else {
      console.error(JSON.stringify(error.message));
    }
  }
});

app.post("/uploadImage", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      throw new Error("No file uploaded");
    }
    console.log(req.file);
    const filePath = `./uploads/${req.file.filename}`;
    const fileData = fs.readFileSync(`./uploads/${req.file.filename}`);
    const result = await axios.post(apiURL, fileData, {
      headers: {
        "Content-type": req.file.mimetype,
      },
    });
    const episode = result.data.result[0].episode;
    const fromMin = Math.floor(result.data.result[0].from / 60);
    const fromSec = Math.floor(result.data.result[0].from % 60);

    const toMin = Math.floor(result.data.result[0].to / 60);
    const toSec = Math.floor(result.data.result[0].to % 60);

    const anilistID = result.data.result[0].anilist;
    // const anilistID =142329
    console.log(anilistID);

    const aniListResponse = await axios.post(
      "https://graphql.anilist.co",
      {
        query: aniListQuery,
        variables: { id: anilistID },
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    const animeDetail = aniListResponse.data.data.Media;
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error(`Failed to delete file: ${filePath}`);
      } else {
        console.log(`Successfully deleted file: ${filePath}`);
      }
    });
    // console.log(JSON.stringify(animeDetail))
    res.render("found.ejs", {
      videoSrc: result.data.result[0].video,
      ep: episode,
      fm: fromMin,
      fs: fromSec,
      tm: toMin,
      ts: toSec,
      animeDetails: animeDetail,
    });
  } catch (error) {
    if (error.response) {
      console.error(JSON.stringify(error.response.data));
    } else {
      console.error(JSON.stringify(error.message));
    }
  }
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
