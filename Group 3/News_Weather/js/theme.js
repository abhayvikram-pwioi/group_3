console.log("Theme connected");


let darkBtn =
document.querySelector("#darkBtn");


// check saved theme

if(localStorage.getItem("theme") === "dark"){

    document.body.classList.add("dark");

    darkBtn.innerHTML = "☀️";

}




darkBtn.addEventListener("click",function(){


    document.body.classList.toggle("dark");



    if(document.body.classList.contains("dark")){


        darkBtn.innerHTML = "☀️";


        localStorage.setItem(
            "theme",
            "dark"
        );


    }


    else{


        darkBtn.innerHTML = "🌙";


        localStorage.setItem(
            "theme",
            "light"
        );


    }


});