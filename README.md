# PhysDebris
I wonder how the satellites colliding with another satellites or even from its debris. That's why we make a simple app of satellite-colliding simulations, and it's not only limited to collisions, but also we have simulations of satellite lifespans. When it's exceeding its expected lifetime, the satellite itself will fall from the space to prevent collisions and creating more space debris.

We're not playing as a human/spaceman here. But... we're going to play as a space debris. Collide with every satellites we have here and you got who are impacted :DD


# Why Does It Important?
Space debris itself didn't give too much impact on humankind on earth, but when it collides with another satellites, it makes another satellites that collides gets shattered and disrupts its functions, take an example of communication satellites that provides communication access to others wirelessly. When it collides, it will distrupts the wireless communications on a country that depends on it. 

So we got an idea on how to simulates the collisions without really harming another satellites. With this simple js/html/css code, we'd just made the logic of timelapse, collisions, cause-effects of collisions, and many more. 

To create the data of the satellite itself, we used converted file from xlsx to csv to make it easier to render. We found that the file is quite outdated, but we're just making the demo of the satellites. The file can be accessed below : 
https://www.ucs.org/resources/satellite-database

To reduce the resource consumption from the website, we're only able to provide 8 satellites to showing up on the screen. Once a satellite had been destroyed, we added a new satellite. 

# About The AI 
We're using ChatGPT, Gemini, and Claude AI to draft, creating the code, while we're finding those bugs and try to fix it. Those AI's are used to create assets by using js canvas (This is the first time we're using this too. I'm used to draw it by hand) and doing some improvements, to make it look like a satellite (the first iterations didn't give us the right satellite object, so we got to refine it again). Asking commands to AI on how to use ctx canvas, from how to draw it to place it in the right place, since ctx uses coordinates, so we got to reverse-engineering the points.

We also use AI to create the required components, e.g. UI. We planned to create cyber-like UI because we wanted to make it look like a game instead of corporate website. But we found that the UI logic didn't match to us, so instead of waiting (we know about CSS), so instead of iterating to AI that costs token more, we're just changing the code manually, and it's fun. 

# Collaboration
Thanks to Techbypavy (https://github.com/TechbyPavy) to created, refined, debugging the ideas