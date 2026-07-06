console.log("Weather connected");


// ================= API URLS =================

const GEO_URL =
"https://geocoding-api.open-meteo.com/v1/search";


const WEATHER_URL =
"https://api.open-meteo.com/v1/forecast";


const REVERSE_URL =
"https://api.bigdatacloud.net/data/reverse-geocode-client";





// ================= SELECT ELEMENTS =================

let cityInput =
document.querySelector("#cityInput");


let weatherButton =
document.querySelector("#weatherBtn");


let weatherResult =
document.querySelector("#weatherResult");





// ================= BUTTON EVENT =================

weatherButton.addEventListener("click", function(){

    getWeather();

});





// ================= WEATHER CONDITION =================

function getWeatherCondition(code){


    if(code == 0){

        return "☀️ Clear Sky";

    }


    else if(code <= 3){

        return "⛅ Cloudy";

    }


    else if(code >= 51){

        return "🌧 Rain";

    }


    else{

        return "🌤 Normal";

    }


}





// ================= DISPLAY WEATHER =================

async function displayWeather(latitude, longitude, city){


    try{


        weatherResult.innerHTML =
        "Loading weather...";




        let response =
        await fetch(

`${WEATHER_URL}?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`

        );




        let weatherData =
        await response.json();



        console.log(
            "WEATHER DATA",
            weatherData
        );




        let today =
        new Date().toDateString();






        weatherResult.innerHTML = `


        <div class="weather-card">


            <h2>
                📍 ${city}
            </h2>



            <p>
                📅 ${today}
            </p>




            <h1>

                ${weatherData.current.temperature_2m} °C

            </h1>




            <h3>

                ${getWeatherCondition(
                    weatherData.current.weather_code
                )}

            </h3>





            <div class="weather-details">


                <p>

                    💧 Humidity

                    <br>

                    ${weatherData.current.relative_humidity_2m} %

                </p>





                <p>

                    💨 Wind Speed

                    <br>

                    ${weatherData.current.wind_speed_10m} km/h

                </p>


            </div>



        </div>


        `;


    }




    catch(error){


        console.log(error);


        weatherResult.innerHTML =
        "Unable to load weather";


    }


}







// ================= SEARCH WEATHER BY CITY =================

async function getWeather(){


    try{


        let city =
        cityInput.value.trim();




        if(city == ""){


            weatherResult.innerHTML =
            "Please enter city name";


            return;


        }






        weatherResult.innerHTML =
        "Searching city...";






        let response =
        await fetch(

`${GEO_URL}?name=${city}&count=1`

        );





        let locationData =
        await response.json();





        console.log(
            "LOCATION DATA",
            locationData
        );





        if(!locationData.results){


            weatherResult.innerHTML =
            "City not found";


            return;


        }






        let latitude =
        locationData.results[0].latitude;



        let longitude =
        locationData.results[0].longitude;



        let cityName =
        locationData.results[0].name;







        displayWeather(

            latitude,

            longitude,

            cityName

        );



    }





    catch(error){



        console.log(error);



        weatherResult.innerHTML =
        "Weather failed";



    }


}








// ================= USER CURRENT LOCATION =================


window.addEventListener("load", function(){


    getUserLocation();


});







function getUserLocation(){


    if(navigator.geolocation){



        weatherResult.innerHTML =
        "Detecting your location...";





        navigator.geolocation.getCurrentPosition(




            async function(position){



                let latitude =
                position.coords.latitude;




                let longitude =
                position.coords.longitude;








                let response =
                await fetch(

`${REVERSE_URL}?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`

                );






                let locationData =
                await response.json();






                console.log(
                    "USER LOCATION",
                    locationData
                );






                let cityName =
                locationData.city ||
                locationData.locality ||
                "Your Location";







                displayWeather(

                    latitude,

                    longitude,

                    cityName

                );



            },






            function(){



                weatherResult.innerHTML =
                "Location denied. Search city manually.";



            }



        );



    }





    else{


        weatherResult.innerHTML =
        "Location not supported";


    }


}