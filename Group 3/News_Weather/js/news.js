console.log("News connected");


const NEWS_URL = "https://newsdata.io/api/1/latest";
const API_KEY = "pub_e093d6db150447ddb0646673aca10498";


// ================= SELECT ELEMENTS =================

let category = document.querySelector("#category");
let newsSearch = document.querySelector("#newsSearch");
let newsButton = document.querySelector("#btn");
let newsResult = document.querySelector("#result");


// ================= BUTTON EVENT =================


newsButton.addEventListener("click", function(){

    getNews();

});



// ================= FETCH NEWS =================


async function getNews(){

    try{


        let selectedCategory =
        category.value;


        let searchText =
        newsSearch.value;



        newsResult.innerHTML =
        "Loading news...";



        let apiURL;


        if(searchText){

            apiURL =
            `${NEWS_URL}?apikey=${API_KEY}&q=${searchText}&language=en`;

        }

        else{

            apiURL =
            `${NEWS_URL}?apikey=${API_KEY}&category=${selectedCategory}&language=en`;

        }




        let response =
        await fetch(apiURL);



        let newsData =
        await response.json();



        console.log(
            "NEWS DATA",
            newsData
        );



        if(!newsData.results || newsData.results.length == 0){

            newsResult.innerHTML =
            "No articles available";

            return;

        }



        let allNews = "";



        newsData.results.forEach(function(article){


            allNews += `


            <div>


                <img

                src="${article.image_url || "https://placehold.co/600x400?text=News"}"

                alt="news image"

                onerror="this.src='https://placehold.co/600x400?text=News'"

                >



                <h2>

                    ${article.title}

                </h2>



                <p>

                    ${article.description || "No description available"}

                </p>



                <p>

                    Source : ${article.source_id}

                </p>



                <p>

                    Published : ${article.pubDate}

                </p>



                <a href="${article.link}" target="_blank">

                    Read Full News

                </a>


            </div>


            `;


        });



        newsResult.innerHTML =
        allNews;


    }


    catch(error){

        console.log(error);


        newsResult.innerHTML =
        "News loading failed";

    }


}



// Default load


getNews();