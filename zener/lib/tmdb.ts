import { tmdbKey } from "../../env.ts";

const tmdbImageBasePath = "https://image.tmdb.org/t/p/original/";
import ISO6391 from "iso-639-1";

const getExtraDetails = async (id: string): Promise<any> => {
  const response = await fetch(
    `https://api.themoviedb.org/3/movie/${id}?language=en-US`,
    {
      headers: {
        Authorization: `Bearer ${tmdbKey}`,
        Accept: "application/json",
      },
    },
  );
  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.statusText}`);
  }
  const data = await response.json();
  return {
    genres: data.genres?.map((g: any) => g.name).join(", ") || "",
    overview: data.overview || "",
    runtime: data.runtime || 0,
    original_language: ISO6391.getName(data.original_language || "") || "",
  };
};

const searchMovie = async (movieName: string, {lang, year}: {lang?: string, year?: string},recurs = false): Promise<any> => {
  // https://api.themoviedb.org/3/search/movie?query=Kandukondain%20Kandukondain&include_adult=true&primary_release_year=en&page=1

    let queryString = movieName;
  if(!recurs){
    queryString = movieName.replace(lang || "", "").replace(year || "", "").trim();
    console.log(`Searching TMDB for: ${queryString}`);
  }
  if(recurs){
  
    console.log(`Refining TMDB search for: ${queryString} ${lang}`);
  }

  const response = await fetch(
    `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(queryString)}&include_adult=true&primary_release_year=en&page=1`,
    {
      headers: {
        Authorization: `Bearer ${tmdbKey}`,
        Accept: "application/json",
      },
    },
  );
  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.statusText}`);
  }
  const data = await response.json();
  if (data.total_results > 500) {
    if (lang){
      return await searchMovie(movieName + " " + lang, {lang: "", year: year},true);
    }else if(year){
      return await searchMovie(movieName + " " + year, {lang: lang, year: ""},true);
    }
  } else {
    const results = data.results || [];
    const moreDetails = results[0]?.id
      ? await getExtraDetails(results[0].id)
      : {};

    return {
      tmdbId: results[0]?.id || "",
      title: results[0]?.title || "",
      release_date: results[0]?.release_date.replace("-", "/") || "",
      poster: tmdbImageBasePath + results[0]?.poster_path || "",
      backdrop: tmdbImageBasePath + results[0]?.backdrop_path || "",
      ...moreDetails,
    };
  }
};

`the output object params
{
    title: string,
    release_date: string,
    poster: string,
    backdrop: string,
    genres: string,
    overview: string,
    runtime: number,
    original_language: string
}

`;

export { searchMovie };
