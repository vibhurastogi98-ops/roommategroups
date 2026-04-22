(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))i(s);new MutationObserver(s=>{for(const o of s)if(o.type==="childList")for(const n of o.addedNodes)n.tagName==="LINK"&&n.rel==="modulepreload"&&i(n)}).observe(document,{childList:!0,subtree:!0});function a(s){const o={};return s.integrity&&(o.integrity=s.integrity),s.referrerPolicy&&(o.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?o.credentials="include":s.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function i(s){if(s.ep)return;s.ep=!0;const o=a(s);fetch(s.href,o)}})();const jt="rg_analytics";function Ue(){try{return JSON.parse(localStorage.getItem(jt)||"{}")}catch{return{}}}function Dt(e){try{localStorage.setItem(jt,JSON.stringify(e))}catch(t){console.error("[Analytics] Failed to save:",t)}}function ii(){return new Date().toISOString().slice(0,10)}function ai(e){if(e.startsWith("/admin"))return;const t=Ue(),a=ii();t.total_visits=(t.total_visits||0)+1,t.daily_visits||(t.daily_visits={}),t.daily_visits[a]=(t.daily_visits[a]||0)+1,Dt(t)}function si(e,t){if(e.trim()==="")return;const a=Ue();a.searches||(a.searches=[]),a.searches.push({query:e.trim().toLowerCase(),results:t,ts:new Date().toISOString()}),a.searches.length>1e3&&(a.searches=a.searches.slice(-1e3)),Dt(a)}function oi(){return Ue().total_visits||0}function ri(e=5){const t=Ue().searches||[],a={};return t.forEach(i=>{a[i.query]=(a[i.query]||0)+1}),Object.entries(a).sort((i,s)=>s[1]-i[1]).slice(0,e).map(([i,s])=>({query:i,count:s}))}function ni(e=5){const t=(Ue().searches||[]).filter(i=>i.results===0),a={};return t.forEach(i=>{a[i.query]=(a[i.query]||0)+1}),Object.entries(a).sort((i,s)=>s[1]-i[1]).slice(0,e).map(([i,s])=>({query:i,count:s}))}const Be={},Et=[];let rt=null;function li(e){rt=e,window.addEventListener("popstate",nt),window.navigate=X,document.addEventListener("click",t=>{const a=t.target.closest("a");if(a&&a.href.startsWith(window.location.origin)&&!a.hasAttribute("data-external")){t.preventDefault();const i=a.getAttribute("href");X(i)}}),nt()}function V(e,t,a=[]){Be[e]={handler:t,middleware:a}}function X(e){window.history.pushState({},"",e),nt()}async function nt(){const t=(window.location.pathname||"/").split("?")[0];console.log("[Router] Resolving:",t),console.log("[Router] Available routes:",Object.keys(Be));let a=Be[t],i={};if(!a){for(const s in Be)if(s.includes(":")){const o=s.split("/").filter(l=>l!==""),n=t.split("/").filter(l=>l!=="");if(console.log("[Router] Trying pattern:",s,"parts:",o.length,"vs hash parts:",n.length),o.length===n.length){const l=o.every((d,v)=>d.startsWith(":")||d===n[v]);if(console.log("[Router] Length match for",s,"- content match:",l),l){a=Be[s],o.forEach((d,v)=>{d.startsWith(":")&&(i[d.slice(1)]=n[v])}),console.log("[Router] Matched route:",s,"params:",i);break}}}}if(window.scrollTo(0,0),ai(t),a){console.log("[Router] Handler found, running middleware...");for(const s of Et)if(await s(t,i)===!1)return;for(const s of a.middleware)if(await s(t,i)===!1)return;a.handler(rt,i)}else{console.log("[Router] No handler found! Falling back to home.");const s=Be["/"];if(s){for(const o of Et)if(await o("/",{})===!1)return;for(const o of s.middleware)if(await o("/",{})===!1)return;s.handler(rt,{})}}}const Xe="rg_database",fe=new Set(["user_host_1","user_guest_1","user_guest_2","user_guest_3","user_guest_4","user_guest_5","user_rm_1","user_rm_2","user_rm_3"]),$e={users:[{user_id:"user_admin_1",email:"admin@roommategroups.com",display_name:"RG Admin",profile_photo:"",bio:"System Administrator",city:"city_austin",age_range:"25-30",lifestyle_tags:[],verification_level:"id",subscription_tier:"admin",stripe_customer_id:"cus_admin001",saved_listings:[],saved_searches:[],blocked_users:[],passwordHash:"h_n7qt9z",role:"admin",is_active:!0,created_at:"2025-01-01T00:00:00Z",last_active:new Date().toISOString()}],listings:[],cities:[{city_id:"city_austin",name:"Austin",slug:"austin",country:"country_us",state_province:"TX",latitude:30.2672,longitude:-97.7431,hero_image:"https://images.unsplash.com/photo-1531218150217-54595bc2b934?w=800&q=80",description:"<h3>A Guide to Living in Austin, Texas</h3><p>Austin is one of the fastest-growing cities in the United States.</p><h4>Cost of Living</h4><p>The median rent for a one-bedroom is around $1,600.</p>",avg_rent:1450,listing_count:342,member_count:1200,is_active:!0,show_in_popular:!0,show_in_footer:!0,meta_title:"Rooms for Rent in Austin | Find Roommates - RoommateGroups",meta_description:"Discover verified rooms for rent and roommates in Austin, TX.",faq_items:[{question:"What is the average rent in Austin?",answer:"The average rent for a private room in Austin is approximately $1,150 per month."},{question:"How do I find a roommate in Austin?",answer:"Browse profiles on RoommateGroups, filtering by lifestyle tags, budget, and neighborhood."},{question:"What are the best neighborhoods for renters in Austin?",answer:"Downtown for luxury, East Austin for a bohemian vibe, and West Campus for students."},{question:"Is public transport reliable in Austin?",answer:"Austin has a growing CapMetro system, but most residents benefit from having a car."},{question:"When is the best time to search?",answer:"April–June is the peak season as many student leases expire."}]},{city_id:"city_portland",name:"Portland",slug:"portland",country:"country_us",state_province:"OR",latitude:45.5152,longitude:-122.6784,hero_image:"https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&q=80&v=3",description:"Keep Portland Weird",avg_rent:1300,listing_count:218,member_count:850,is_active:!0,show_in_popular:!0,show_in_footer:!0,faq_items:[]},{city_id:"city_san_antonio",name:"San Antonio",slug:"san-antonio",country:"country_us",state_province:"TX",latitude:29.4241,longitude:-98.4936,hero_image:"https://images.unsplash.com/photo-1531218150217-54595bc2b934?w=1600&h=600&fit=crop&v=3",description:"The Alamo City",avg_rent:1100,listing_count:185,member_count:600,is_active:!0,show_in_popular:!1,show_in_footer:!1,faq_items:[]},{city_id:"city_houston",name:"Houston",slug:"houston",country:"country_us",state_province:"TX",latitude:29.7604,longitude:-95.3698,hero_image:"https://images.unsplash.com/photo-1530089711124-9ca31fb9e863?w=1600&h=600&fit=crop&v=3",description:"Space City",avg_rent:1350,listing_count:412,member_count:1500,is_active:!1,show_in_popular:!1,show_in_footer:!1,faq_items:[]},{city_id:"city_dallas",name:"Dallas",slug:"dallas",country:"country_us",state_province:"TX",latitude:32.7767,longitude:-96.797,hero_image:"https://images.unsplash.com/photo-1568240219730-85f8398687b1?w=1600&h=600&fit=crop&v=3",description:"Big D",avg_rent:1400,listing_count:367,member_count:1100,is_active:!0,show_in_popular:!1,show_in_footer:!1,faq_items:[]},{city_id:"city_seattle",name:"Seattle",slug:"seattle",country:"country_us",state_province:"WA",latitude:47.6062,longitude:-122.3321,hero_image:"https://images.unsplash.com/photo-1502175353174-a7a70e73b362?auto=format&fit=crop&w=800&q=85&v=3",description:"Emerald City",avg_rent:1800,listing_count:456,member_count:1300,is_active:!0,show_in_popular:!0,show_in_footer:!0,faq_items:[]},{city_id:"city_sf",name:"San Francisco",slug:"san-francisco",country:"country_us",state_province:"CA",latitude:37.7749,longitude:-122.4194,hero_image:"https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=800&q=85&v=3",description:"Bay Area",avg_rent:2500,listing_count:892,member_count:2200,is_active:!0,show_in_popular:!0,show_in_footer:!0,faq_items:[]},{city_id:"city_la",name:"Los Angeles",slug:"los-angeles",country:"country_us",state_province:"CA",latitude:34.0522,longitude:-118.2437,hero_image:"https://images.unsplash.com/photo-1444723121867-7a241cacace9?auto=format&fit=crop&w=800&q=85&v=3",description:"City of Angels",avg_rent:2100,listing_count:1204,member_count:3100,is_active:!0,show_in_popular:!0,show_in_footer:!0,faq_items:[]},{city_id:"city_nola",name:"New Orleans",slug:"new-orleans",country:"country_us",state_province:"LA",latitude:29.9511,longitude:-90.0715,hero_image:"https://images.unsplash.com/photo-1549925245-da6cb6824962?auto=format&fit=crop&w=800&q=85&v=3",description:"The Big Easy",avg_rent:1200,listing_count:156,member_count:450,is_active:!0,show_in_popular:!0,show_in_footer:!0,faq_items:[]},{city_id:"city_paris",name:"Paris",slug:"paris",country:"country_fr",state_province:"IDF",latitude:48.8566,longitude:2.3522,hero_image:"https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=85&v=3",description:"City of Light",avg_rent:1400,listing_count:678,member_count:1800,is_active:!0,show_in_popular:!0,show_in_footer:!0,faq_items:[]},{city_id:"city_berlin",name:"Berlin",slug:"berlin",country:"country_de",state_province:"BE",latitude:52.52,longitude:13.405,hero_image:"https://images.unsplash.com/photo-1560969184-10fe8719e047?auto=format&fit=crop&w=800&q=85&v=3",description:"Capital of Germany",avg_rent:1100,listing_count:534,member_count:1500,is_active:!0,show_in_popular:!0,show_in_footer:!0,faq_items:[]},{city_id:"city_amsterdam",name:"Amsterdam",slug:"amsterdam",country:"country_nl",state_province:"NH",latitude:52.3676,longitude:4.9041,hero_image:"https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?auto=format&fit=crop&w=800&q=85&v=3",description:"Venice of the North",avg_rent:1600,listing_count:412,member_count:1100,is_active:!0,show_in_popular:!0,show_in_footer:!0,faq_items:[]},{city_id:"city_charleston",name:"Charleston",slug:"charleston",country:"country_us",state_province:"SC",latitude:32.7765,longitude:-79.9311,hero_image:"https://images.unsplash.com/photo-1551061713-2868fb7303d4?auto=format&fit=crop&w=800&q=85&v=3",description:"Holy City",avg_rent:1500,listing_count:98,member_count:300,is_active:!0,show_in_popular:!0,show_in_footer:!0,faq_items:[]},{city_id:"city_detroit",name:"Detroit",slug:"detroit",country:"country_us",state_province:"MI",latitude:42.3314,longitude:-83.0458,hero_image:"https://images.unsplash.com/photo-1502174832274-bc1ec64c3963?auto=format&fit=crop&w=800&q=85&v=3",description:"Motor City",avg_rent:1e3,listing_count:187,member_count:550,is_active:!0,show_in_popular:!0,show_in_footer:!0,faq_items:[]},{city_id:"city_st_louis",name:"St. Louis",slug:"st-louis",country:"country_us",state_province:"MO",latitude:38.627,longitude:-90.1994,hero_image:"https://images.unsplash.com/photo-1471644865743-1623432420fd?auto=format&fit=crop&w=800&q=85&v=3",description:"Gateway to the West",avg_rent:1050,listing_count:143,member_count:400,is_active:!0,show_in_popular:!0,faq_items:[]}],countries:[{country_id:"country_us",name:"United States",slug:"us",code:"US",flag_emoji:"🇺🇸",is_active:!0},{country_id:"country_fr",name:"France",slug:"france",code:"FR",flag_emoji:"🇫🇷",is_active:!0},{country_id:"country_de",name:"Germany",slug:"germany",code:"DE",flag_emoji:"🇩🇪",is_active:!0},{country_id:"country_nl",name:"Netherlands",slug:"netherlands",code:"NL",flag_emoji:"🇳🇱",is_active:!0}],neighborhoods:[],threads:[],messages:[],reports:[],admin_logs:[],user_queries:[],amenities:[{amenity_id:"amen_wifi",name:"High-Speed WiFi",icon:"fa-wifi"},{amenity_id:"amen_laundry",name:"In-unit Laundry",icon:"fa-washing-machine"},{amenity_id:"amen_ac",name:"Air Conditioning",icon:"fa-snowflake"},{amenity_id:"amen_parking",name:"Parking",icon:"fa-car"},{amenity_id:"amen_gym",name:"Gym",icon:"fa-dumbbell"}],tags:[{tag_id:"tag_clean",name:"Clean",icon:"fa-broom"},{tag_id:"tag_social",name:"Social",icon:"fa-users"},{tag_id:"tag_quiet",name:"Quiet",icon:"fa-volume-xmark"},{tag_id:"tag_pet",name:"Pet-Friendly",icon:"fa-paw"}],categories:[{category_id:"cat_1",name:"City Guides",slug:"city-guides",description:"Guides to living in various cities.",color:"#1a1a1a"},{category_id:"cat_2",name:"Roommate Tips",slug:"roommate-tips",description:"Tips for finding and living with roommates.",color:"#333333"},{category_id:"cat_3",name:"Market Reports",slug:"market-reports",description:"Data and insights on the rental market.",color:"#333333"},{category_id:"cat_4",name:"Moving Guides",slug:"moving-guides",description:"Step-by-step guides for a smooth move.",color:"#555555"},{category_id:"cat_5",name:"Student Housing",slug:"student-housing",description:"Housing tips and resources for students.",color:"#555555"}],posts:[{post_id:"post_1",slug:"ultimate-guide-splitting-rent",title:"The Ultimate Guide to Splitting Rent Fairly",excerpt:"Discover the best methods for dividing rent up among roommates without ruining your friendship. Learn about income-based splits and room size calculations.",category:"Roommate Tips",author:{name:"Sarah Jenkins",avatar:"https://i.pravatar.cc/150?img=1",bio:"Sarah is a housing expert and former mediator who specializes in helping co-living arrangements thrive. She has lived with over 15 different roommates in 4 cities."},date:"Oct 12, 2026",readTime:"8 min read",image:"https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&q=80&w=1200",content:`<p class="lead">Splitting rent with roommates can be tricky. Here's our comprehensive guide to doing it fairly.</p><h2>1. Income-Based Split</h2><p>The most common method is to split rent proportionally based on each person's income. If one person earns 60% of the total household income, they pay 60% of the rent.</p><h2>2. Room Size Method</h2><p>Larger rooms should cost more. A master bedroom with private bathroom might be worth 1.5x a smaller bedroom.</p><h2>3. Equal Split</h2><p>Simplest method - everyone pays the same. Best for similar incomes and room sizes.</p>`,published_date:"2026-10-12T12:00:00Z",is_published:!0},{post_id:"post_2",slug:"renters-guide-austin-neighborhoods",title:"A Renter's Guide to Austin Neighborhoods",excerpt:"Moving to Austin? From the bustling streets of Downtown to the quirky vibes of South Congress, we explore the best neighborhoods for renters.",category:"City Guides",author:{name:"Emily Rogers",avatar:"https://i.pravatar.cc/150?img=5",bio:"Emily is an Austin native who loves exploring the city's food truck scene and live music venues."},date:"Oct 09, 2026",readTime:"12 min read",image:"https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&q=80&w=1200",content:`<p class="lead">Austin is notoriously sprawling and diverse. Finding the right neighborhood is the difference between loving your time here and spending half your life in traffic on I-35.</p><h2>South Congress (SoCo)</h2><p>If you have the budget and want to be in the center of the "Keep Austin Weird" culture, SoCo is the place. It is highly walkable, filled with vintage boutiques, iconic eateries, and live music. Rent is premium here, so pairing up with roommates is highly recommended.</p><h2>The Domain (North Austin)</h2><p>Often called "Austin's second downtown," The Domain is a massive mixed-use development that feels a bit more like Silicon Valley than Texas. If you work in tech and hate commuting, this is where you want to be. The apartments are new, amenity-heavy, and pricey.</p><h2>East Austin</h2><p>Once the industrial side of town, the East Side is now the epicenter of Austin's hip food, brewery, and arts scene. It's grittier than The Domain but offers more character and slightly more affordable duplex and housing rentals for roommate groups.</p>`,published_date:"2026-10-09T12:00:00Z",is_published:!0},{post_id:"post_3",slug:"red-flags-apartment-tours",title:"Red Flags to Watch Out For During Apartment Tours",excerpt:"Don't sign that lease until you've checked these 7 crucial areas. Learn how to spot hidden water damage, pest issues, and bad landlords.",category:"Moving Guides",author:{name:"Michael Vance",avatar:"https://i.pravatar.cc/150?img=8",bio:"Michael is a property manager turned tenant advocate. He exposes the tricks bad landlords use to hide apartment defects."},date:"Sep 28, 2026",readTime:"6 min read",image:"https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&q=80&w=1200",content:`<p class="lead">Apartment tours are designed to sell you on the space. Staging, lighting, and fresh paint can hide a multitude of sins. Here is exactly what you should be looking for.</p><h2>1. The Water Pressure Test</h2><p>Never walk out of a viewing without turning on the shower. Bad water pressure is rarely fixable because it usually points to building-wide plumbing issues. Turn on the sink and shower at the same time and flush the toilet. Did the temperature drop? Did the pressure die? Red flag.</p><h2>2. Cellular Service Dead Zones</h2><p>In the age of remote work, moving into an apartment where you can't get a signal is a disaster. Be sure to check your phone in every room—especially the room you plan to use as an office.</p><h2>3. Inspecting for Pests</h2><p>Don't just look at the floors. Open the cabinets under the sink. Look for small droppings or traps the landlord "forgot" to remove. Check the baseboards for gaps where insects might enter.</p><blockquote>"A fresh coat of paint over a water stain doesn't fix a leaking roof. Look up at the ceilings, not just down at the floors."</blockquote>`,published_date:"2026-09-28T12:00:00Z",is_published:!0}],fb_countries:[{fb_country_id:"fbc_1",country_name:"United States",created_at:"2026-01-01T00:00:00Z"},{fb_country_id:"fbc_2",country_name:"United Kingdom",created_at:"2026-01-01T00:00:00Z"},{fb_country_id:"fbc_3",country_name:"Germany",created_at:"2026-01-01T00:00:00Z"},{fb_country_id:"fbc_4",country_name:"France",created_at:"2026-01-01T00:00:00Z"},{fb_country_id:"fbc_5",country_name:"Australia",created_at:"2026-01-01T00:00:00Z"},{fb_country_id:"fbc_6",country_name:"Canada",created_at:"2026-01-01T00:00:00Z"}],fb_cities:[{fb_city_id:"fbcity_1",country_id:"fbc_1",city_name:"Austin",city_image:"https://images.unsplash.com/photo-1531218150217-54595bc2b934?w=800&h=400&fit=crop",fb_group_name:"Austin Roommates & Rooms for Rent",fb_group_link:"https://www.facebook.com/groups/austinroommates",total_members:24800,is_popular:!0,priority:1,created_at:"2026-01-01T00:00:00Z"},{fb_city_id:"fbcity_2",country_id:"fbc_1",city_name:"New York City",city_image:"https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&h=400&fit=crop",fb_group_name:"NYC Rooms & Roommates",fb_group_link:"https://www.facebook.com/groups/nycroommates",total_members:142e3,is_popular:!0,priority:2,created_at:"2026-01-01T00:00:00Z"},{fb_city_id:"fbcity_3",country_id:"fbc_1",city_name:"Los Angeles",city_image:"https://images.unsplash.com/photo-1580655653885-65763b2597d0?w=800&h=400&fit=crop",fb_group_name:"Los Angeles Roommates",fb_group_link:"https://www.facebook.com/groups/laroommates",total_members:89500,is_popular:!0,priority:3,created_at:"2026-01-01T00:00:00Z"},{fb_city_id:"fbcity_4",country_id:"fbc_1",city_name:"Seattle",city_image:"https://images.unsplash.com/photo-1542944037-460b12bc1126?w=800&h=400&fit=crop",fb_group_name:"Seattle Roommates & Housing",fb_group_link:"https://www.facebook.com/groups/seattleroommates",total_members:31200,is_popular:!0,priority:4,created_at:"2026-01-01T00:00:00Z"},{fb_city_id:"fbcity_5",country_id:"fbc_1",city_name:"Chicago",city_image:"https://images.unsplash.com/photo-1494522303221-719e8b46ed65?w=800&h=400&fit=crop",fb_group_name:"Chicago Roommates & Apartments",fb_group_link:"https://www.facebook.com/groups/chicagoroommates",total_members:67300,is_popular:!0,priority:5,created_at:"2026-01-01T00:00:00Z"},{fb_city_id:"fbcity_6",country_id:"fbc_2",city_name:"London",city_image:"https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&h=400&fit=crop",fb_group_name:"London Flatmates & Room to Rent",fb_group_link:"https://www.facebook.com/groups/londonflatmates",total_members:215e3,is_popular:!0,priority:6,created_at:"2026-01-01T00:00:00Z"},{fb_city_id:"fbcity_7",country_id:"fbc_2",city_name:"Manchester",city_image:"https://images.unsplash.com/photo-1543872084-c7bd3822856f?w=800&h=400&fit=crop",fb_group_name:"Manchester Rooms & Flatmates",fb_group_link:"https://www.facebook.com/groups/manchesterrooms",total_members:38400,is_popular:!0,priority:7,created_at:"2026-01-01T00:00:00Z"},{fb_city_id:"fbcity_8",country_id:"fbc_3",city_name:"Berlin",city_image:"https://images.unsplash.com/photo-1528728329032-2972f65dfb3f?w=800&h=400&fit=crop",fb_group_name:"Berlin Rooms & WG Zimmer",fb_group_link:"https://www.facebook.com/groups/berlinrooms",total_members:92100,is_popular:!0,priority:8,created_at:"2026-01-01T00:00:00Z"},{fb_city_id:"fbcity_9",country_id:"fbc_3",city_name:"Munich",city_image:"https://images.unsplash.com/photo-1595867818082-083862f3d630?w=800&h=400&fit=crop",fb_group_name:"Munich Apartments & WG",fb_group_link:"https://www.facebook.com/groups/munichrooms",total_members:44600,is_popular:!0,priority:9,created_at:"2026-01-01T00:00:00Z"},{fb_city_id:"fbcity_10",country_id:"fbc_4",city_name:"Paris",city_image:"https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&h=400&fit=crop",fb_group_name:"Paris Colocation & Rooms",fb_group_link:"https://www.facebook.com/groups/pariscolocation",total_members:78900,is_popular:!0,priority:10,created_at:"2026-01-01T00:00:00Z"},{fb_city_id:"fbcity_11",country_id:"fbc_5",city_name:"Sydney",city_image:"https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800&h=400&fit=crop",fb_group_name:"Sydney Flatmates & Share Houses",fb_group_link:"https://www.facebook.com/groups/sydneyflatmates",total_members:56200,is_popular:!0,priority:11,created_at:"2026-01-01T00:00:00Z"},{fb_city_id:"fbcity_12",country_id:"fbc_5",city_name:"Melbourne",city_image:"https://images.unsplash.com/photo-1545044846-351ba102b6d5?w=800&h=400&fit=crop",fb_group_name:"Melbourne Rooms & Flatmates",fb_group_link:"https://www.facebook.com/groups/melbournerooms",total_members:48300,is_popular:!0,priority:12,created_at:"2026-01-01T00:00:00Z"},{fb_city_id:"fbcity_13",country_id:"fbc_6",city_name:"Toronto",city_image:"https://images.unsplash.com/photo-1517090504586-fde19ea6066f?w=800&h=400&fit=crop",fb_group_name:"Toronto Roommates & Rooms",fb_group_link:"https://www.facebook.com/groups/torontoroommates",total_members:63800,is_popular:!0,priority:13,created_at:"2026-01-01T00:00:00Z"},{fb_city_id:"fbcity_14",country_id:"fbc_6",city_name:"Vancouver",city_image:"https://images.unsplash.com/photo-1560814304-4f05b62af116?w=800&h=400&fit=crop",fb_group_name:"Vancouver Roommates & Rentals",fb_group_link:"https://www.facebook.com/groups/vancouverroommates",total_members:41700,is_popular:!0,priority:14,created_at:"2026-01-01T00:00:00Z"}]};function Ie(){return JSON.parse(localStorage.getItem(Xe)||"{}")}function Qe(e){try{localStorage.setItem(Xe,JSON.stringify(e))}catch(t){if(t.name==="QuotaExceededError"||t.code===22){console.error("[DB] LocalStorage quota exceeded!",t);const a=(JSON.stringify(e).length/1024).toFixed(2);throw new Error(`Database is full (Quota exceeded). Current size: ${a}KB. Please try uploading smaller images or deleting old posts.`)}throw t}}function di(e){return e+"_"+Date.now()+"_"+Math.random().toString(36).substr(2,6)}class oe{constructor(t,a,i){this.name=t,this.idField=a,this.prefix=i}findAll(){return Ie()[this.name]||[]}findById(t){return this.findAll().find(a=>a[this.idField]===t||a.id===t)||null}find(t){return this.findAll().filter(t)}findOne(t){return this.findAll().find(t)||null}findMany(t={}){return this.findAll().filter(a=>Object.entries(t).every(([i,s])=>i===this.idField&&!a[i]&&a.id?a.id===s:Array.isArray(a[i])&&!Array.isArray(s)?a[i].includes(s):a[i]===s))}create(t){const a=Ie();a[this.name]||(a[this.name]=[]);const i={[this.idField]:di(this.prefix),created_at:new Date().toISOString(),...t};return a[this.name].push(i),Qe(a),i}update(t,a){const i=Ie(),s=i[this.name]||[],o=s.findIndex(n=>n[this.idField]===t||n.id===t);return o===-1?null:(s[o]={...s[o],...a},Qe(i),s[o])}delete(t){const a=Ie(),i=a[this.name]||[];a[this.name]=i.filter(s=>s[this.idField]!==t&&s.id!==t),Qe(a)}}function ci(){if(!!localStorage.getItem(Xe)){console.log("[DB] Using cached localStorage data.");const t=Ie();let a=!1;if(t.fb_countries||(t.fb_countries=$e.fb_countries,a=!0),t.fb_cities?t.fb_cities.length>0&&t.fb_cities[0].is_popular===void 0&&(t.fb_cities=t.fb_cities.map((s,o)=>({...s,is_popular:!0,priority:s.priority!==void 0?s.priority:o+1})),a=!0):(t.fb_cities=$e.fb_cities,a=!0),t.user_queries||(t.user_queries=[],a=!0),(!t.system_version||t.system_version<3)&&(console.log("[DB] Migrating to version 3 (Force Data Sync)"),t.cities=$e.cities.map(s=>{const o=t.cities?.find(n=>n.city_id===s.city_id);return o?{...o,...s}:s}),t.fb_cities=$e.fb_cities,t.system_version=3,a=!0),!t.categories)t.categories=$e.categories,a=!0;else{const s=new Set(t.categories.map(o=>o.category_id));$e.categories.forEach(o=>{s.has(o.category_id)||(t.categories.push(o),a=!0)})}if(t.users&&t.users.some(s=>fe.has(s.user_id))&&(t.users=t.users.filter(s=>!fe.has(s.user_id)),a=!0),t.listings&&t.listings.some(s=>fe.has(s.user_id))&&(t.listings=t.listings.filter(s=>!fe.has(s.user_id)),a=!0),t.threads&&t.threads.some(s=>s.participants&&s.participants.some(o=>fe.has(o)))){const s=new Set(t.threads.filter(o=>o.participants&&o.participants.some(n=>fe.has(n))).map(o=>o.thread_id));t.threads=t.threads.filter(o=>!s.has(o.thread_id)),t.messages&&(t.messages=t.messages.filter(o=>!s.has(o.thread_id))),a=!0}t.reports&&t.reports.some(s=>fe.has(s.reporter_id)||fe.has(s.target_id))&&(t.reports=t.reports.filter(s=>!fe.has(s.reporter_id)&&!fe.has(s.target_id)),a=!0),t.admin_logs&&t.admin_logs.some(s=>fe.has(s.admin_id))&&(t.admin_logs=t.admin_logs.filter(s=>!fe.has(s.admin_id)),a=!0);const i=new Set(["nh_austin_downtown","nh_austin_domain","nh_austin_east","nh_austin_west_campus","nh_austin_south_lamar"]);t.neighborhoods&&t.neighborhoods.some(s=>i.has(s.neighborhood_id))&&(t.neighborhoods=t.neighborhoods.filter(s=>!i.has(s.neighborhood_id)),a=!0),a&&Qe(t);return}console.log("[DB] Seeding localStorage with initial data."),localStorage.setItem(Xe,JSON.stringify($e))}const u={users:new oe("users","user_id","usr"),listings:new oe("listings","listing_id","list"),cities:new oe("cities","city_id","city"),countries:new oe("countries","country_id","country"),neighborhoods:new oe("neighborhoods","neighborhood_id","nh"),messages:new oe("messages","message_id","msg"),threads:new oe("threads","thread_id","thread"),amenities:new oe("amenities","amenity_id","amen"),tags:new oe("tags","tag_id","tag"),reports:new oe("reports","report_id","rpt"),admin_logs:new oe("admin_logs","log_id","log"),categories:new oe("categories","category_id","cat"),posts:new oe("posts","post_id","post"),fb_countries:new oe("fb_countries","fb_country_id","fbc"),fb_cities:new oe("fb_cities","fb_city_id","fbcity"),user_queries:new oe("user_queries","query_id","qry"),notifications:new oe("notifications","notification_id","notif"),getCollection:e=>Ie()[e]||[]};function Ft(e){return(Ie().listings||[]).filter(t=>t.city===e&&t.status==="active").length}const et="rg_session";function lt(e){let t=0;for(let a=0;a<e.length;a++){const i=e.charCodeAt(a);t=(t<<5)-t+i,t|=0}return"h_"+Math.abs(t).toString(36)}function pi(){return"cus_"+Math.random().toString(36).substr(2,14)}async function ui({fullName:e,email:t,password:a}){if(u.users.findOne(o=>o.email.toLowerCase()===t.toLowerCase()))return{success:!1,error:"An account with this email already exists."};const s=u.users.create({display_name:e,email:t.toLowerCase(),passwordHash:a?lt(a):null,city:"",country:"",profile_photo:"",bio:"",age_range:"",occupation:"",lifestyle_tags:[],budgetMin:500,budgetMax:2500,moveInTimeline:"",verification_level:"basic",subscription_tier:"free",stripe_customer_id:pi(),role:"user",saved_listings:[],saved_searches:[],blocked_users:[],emailVerified:!0,profileComplete:!1,last_active:new Date().toISOString(),is_active:!0});return localStorage.setItem(et,JSON.stringify({userId:s.user_id,email:s.email})),{success:!0,user:{...s,id:s.user_id,fullName:s.display_name}}}async function Nt(e,t){let a=u.users.findOne(i=>i.email.toLowerCase()===e.toLowerCase());if(!a)return{success:!1,error:"No account found with this email."};if(!a.passwordHash)a.passwordHash=lt(t||"password123"),u.users.update(a.user_id,{passwordHash:a.passwordHash});else{if(t&&a.passwordHash!==lt(t))return{success:!1,error:"Invalid email or password."};if(!t&&a.passwordHash)return{success:!1,error:"Password is required for this account."}}return u.users.update(a.user_id,{last_active:new Date().toISOString()}),localStorage.setItem(et,JSON.stringify({userId:a.user_id,email:a.email})),{success:!0,user:{...a,id:a.user_id,fullName:a.display_name}}}async function Ut(){localStorage.removeItem(et)}function ee(){const e=JSON.parse(localStorage.getItem(et)||"null");if(!e)return null;const t=u.users.findById(e.userId);return t?{...t,id:t.user_id,fullName:t.display_name}:null}function mi(e,t){const a=u.users.findById(e);if(!a)return{success:!1,error:"User not found."};if(t.city!==void 0&&t.city!==a.city){if(a.city){const o=u.cities.findById(a.city);o&&u.cities.update(o.city_id,{member_count:Math.max(0,(o.member_count||0)-1)})}if(t.city){const o=u.cities.findById(t.city);o&&u.cities.update(o.city_id,{member_count:(o.member_count||0)+1})}}const i={...t,profileComplete:!0};t.profilePhoto!==void 0&&(i.profile_photo=t.profilePhoto),t.ageRange!==void 0&&(i.age_range=t.ageRange),t.lifestyleTags!==void 0&&(i.lifestyle_tags=t.lifestyleTags);const s=u.users.update(e,i);return s?{success:!0,user:{...s,id:s.user_id,fullName:s.display_name}}:{success:!1,error:"User not found."}}function Ht(){const e=ee();return e!==null&&e.role==="admin"}function fi(e){if(!e)return{level:"none",label:"",color:"#E2E8F0",percent:0};let t=0;return e.length>=8&&t++,e.length>=12&&t++,/[a-z]/.test(e)&&/[A-Z]/.test(e)&&t++,/\d/.test(e)&&t++,/[!@#$%^&*(),.?":{}|<>]/.test(e)&&t++,t<=1?{level:"weak",label:"Weak",color:"#1a1a1a",percent:20}:t<=2?{level:"fair",label:"Fair",color:"#555555",percent:40}:t<=3?{level:"good",label:"Good",color:"#777777",percent:60}:t<=4?{level:"strong",label:"Strong",color:"#27AE60",percent:80}:{level:"excellent",label:"Excellent",color:"#333333",percent:100}}function je(e){if(!e)return"";let t=!1,a=!1,i=!1,s=!1;if(typeof e=="string"&&e!=="none")t=!0,(e==="phone"||e==="id"||e==="community")&&(a=!0),(e==="id"||e==="community")&&(i=!0),e==="community"&&(s=!0);else if(typeof e=="object"){const n=e.verification_level||"none";t=!0,a=e.phone_verified||n==="phone"||n==="id"||n==="community",i=e.id_verified||n==="id"||n==="community",s=e.community_verified||n==="community"}let o="";return t&&(o+='<span class="verify-badge verify-email" title="Email Verified"><i class="fa-solid fa-envelope-circle-check" style="color:#333333;"></i></span>'),a&&(o+='<span class="verify-badge verify-phone" title="Phone Verified"><i class="fa-solid fa-phone" style="color:#1a1a1a;"></i></span>'),i&&(o+='<span class="verify-badge verify-id" title="ID Verified"><i class="fa-solid fa-shield-check" style="color:#1a1a1a;"></i></span>'),s&&(o+='<span class="verify-badge verify-community" title="Community Verified"><i class="fa-solid fa-star" style="color:#555555;"></i></span>'),o?'<span class="verification-badges tooltip-badges" style="display:inline-flex;gap:4px;margin-left:6px;">'+o+"</span>":""}function gi(e){return u.threads.find(a=>a.participants.includes(e)&&!a.is_archived).reduce((a,i)=>a+(i[`unread_count_${e}`]||0),0)}function vi(){const e=ee();if(e){const t=e.fullName||e.display_name||"User",a=t.split(" ").map(o=>o[0]).join("").toUpperCase().slice(0,2),i=e.profile_photo||e.profilePhoto||"";return`
            ${Ht()?'<a href="/admin" class="btn btn-outline" style="display:inline-flex;align-items:center;gap:6px;"><i class="fa-solid fa-shield-halved"></i> Admin</a>':""}
            <a href="/dashboard/notifications" class="nav-msg-btn" id="nav-notif-btn" title="Notifications" aria-label="Notifications">
                <i class="fa-solid fa-bell"></i>
                <span class="nav-msg-badge" id="nav-notif-badge" style="display:none;"></span>
            </a>
            <a href="/dashboard/messages" class="nav-msg-btn" id="nav-msg-btn" title="Messages" aria-label="Messages">
                <i class="fa-solid fa-message"></i>
                <span class="nav-msg-badge" id="nav-msg-badge" style="display:none;"></span>
            </a>
            <a href="/dashboard" class="user-avatar-nav" style="background: linear-gradient(135deg, var(--primary), var(--primary-light));">
                ${i?`<img src="${i}" alt="${t}" />`:a}
            </a>
        `}return`
        <a href="/auth/register" class="btn btn-outline">List Your Room</a>
        <a href="/auth/login" class="btn btn-primary">Sign In</a>
    `}function se(){const e=window.location.pathname;return`
    <nav class="navbar" id="navbar">
      <div class="nav-container">
        <a href="/" class="nav-logo">
          <span class="logo-badge">
            <span class="logo-badge-left">Roommate</span><span class="logo-badge-right">Groups</span>
          </span>
        </a>
        ${e==="/"||e===""?`
        <div class="nav-links" id="nav-links">
          <a href="#cities">Cities</a>
          <a href="#how-it-works">How It Works</a>
          <a href="#listings">Listings</a>
          <a href="/blog">Blog</a>
          <a href="/fb-groups" style="display:inline-flex;align-items:center;gap:5px;"><i class="fab fa-facebook" style="color:#1877f2;"></i> FB Groups</a>
        </div>`:'<div class="nav-links" id="nav-links"></div>'}
        <div class="nav-cta" id="nav-cta">
          ${vi()}
        </div>
        <button class="hamburger" id="hamburger" aria-label="Toggle menu">
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </nav>
    `}function hi(){const e=ee();if(!e)return;window._navBadgeInterval&&(clearInterval(window._navBadgeInterval),window._navBadgeInterval=null);function t(){const a=document.getElementById("nav-msg-badge"),i=document.getElementById("nav-notif-badge");if(!a&&!i){clearInterval(window._navBadgeInterval),window._navBadgeInterval=null;return}if(a){const s=gi(e.user_id);s>0?(a.textContent=s>99?"99+":s,a.style.display="flex"):a.style.display="none"}if(i){const s=u.notifications.find(o=>o.user_id===e.user_id&&!o.is_read).length;s>0?(i.textContent=s>99?"99+":s,i.style.display="flex"):i.style.display="none"}}t(),window._navBadgeInterval=setInterval(t,1e4)}function ce(){const e=document.getElementById("navbar");if(!e)return;hi();const t=e.querySelector(".nav-logo");t&&t.addEventListener("click",o=>{o.preventDefault(),window.location.pathname==="/"||window.location.pathname===""?window.scrollTo({top:0,behavior:"smooth"}):(X("/"),requestAnimationFrame(()=>window.scrollTo({top:0,behavior:"instant"})))}),window.addEventListener("scroll",()=>{e.classList.toggle("scrolled",window.scrollY>20)});const a=document.getElementById("hamburger"),i=document.getElementById("nav-links"),s=document.getElementById("nav-cta");a&&i&&a.addEventListener("click",()=>{const o=i.classList.toggle("active");if(s&&(s.classList.toggle("active",o),o)){const l=i.getBoundingClientRect().bottom;s.style.top=l+"px"}const n=a.querySelectorAll("span");o?(n[0].style.transform="rotate(45deg) translate(5px, 5px)",n[1].style.opacity="0",n[2].style.transform="rotate(-45deg) translate(5px, -5px)"):(n[0].style.transform="none",n[1].style.opacity="1",n[2].style.transform="none")}),document.querySelectorAll('.nav-links a[href^="#"]').forEach(o=>{const n=o.getAttribute("href");n.startsWith("#/")||n!=="#"&&o.addEventListener("click",l=>{const d=document.querySelector(n);if(d&&(l.preventDefault(),d.scrollIntoView({behavior:"smooth",block:"start"}),i)){i.classList.remove("active"),s&&s.classList.remove("active");const v=a.querySelectorAll("span");v.length===3&&(v[0].style.transform="none",v[1].style.opacity="1",v[2].style.transform="none")}})})}function ge(){return u.cities.findAll().filter(e=>e.is_active&&e.show_in_footer!==!1),`
    <footer class="footer" id="footer">
        <div class="container">
            <div class="footer-grid">
                <div class="footer-brand">
                    <div class="footer-logo">
                        <span class="logo-badge">
                            <span class="logo-badge-left">Roommate</span><span class="logo-badge-right">Groups</span>
                        </span>
                    </div>
                    <p class="footer-desc">The easiest way to find your perfect room or roommate in cities worldwide. Verified listings, real people, no scams.</p>
                    <div class="footer-social">
                        <a href="https://www.facebook.com/Roommategroups" aria-label="Facebook" target="_blank" rel="noopener noreferrer"><i class="fab fa-facebook-f"></i></a>
                        <a href="https://www.instagram.com/roommategroups" aria-label="Instagram" target="_blank" rel="noopener noreferrer"><i class="fab fa-instagram"></i></a>
                        <a href="https://www.youtube.com/@Roommategroups" aria-label="YouTube" target="_blank" rel="noopener noreferrer"><i class="fab fa-youtube"></i></a>
                    </div>
                </div>
                <div class="footer-cities-section">
                    <h4>Popular Cities</h4>
                    <div class="footer-cities-grid">
                        ${u.cities.find(e=>e.is_active&&e.show_in_popular).map(e=>`<a href="/cities/${e.slug}">${e.name}</a>`).join("")}
                    </div>
                </div>
                <div class="footer-groups-section">
                    <h4>Popular FB Groups</h4>
                    <div class="footer-cities-grid">
                        ${u.fb_cities.find(e=>e.is_footer).sort((e,t)=>(e.priority||0)-(t.priority||0)).map(e=>`<a href="${e.fb_group_link}" target="_blank" rel="noopener noreferrer">${e.city_name} Group</a>`).join("")}
                    </div>
                </div>
                <div class="footer-links-section">
                    <h4>Resources</h4>
                    <ul>
                        <li><a href="/about">About Us</a></li>
                        <li><a href="/blog">Blog</a></li>
                        <li><a href="/faq">FAQ</a></li>
                        <li><a href="/safety">Safety Tips</a></li>
                        <li><a href="/terms">Terms of Service</a></li>
                        <li><a href="/privacy">Privacy Policy</a></li>
                        <li><a href="/contact">Contact Us</a></li>
                    </ul>
                </div>
            </div>
            <div class="footer-bottom">
                &copy; ${new Date().getFullYear()} RoommateGroups. All rights reserved.
            </div>
        </div>
    </footer>`}const Oe=[{name:"Sarah K.",city:"Austin, TX",quote:"Found my perfect roommate within a week! The verified profiles gave me peace of mind during the whole process.",rating:5,initials:"SK",color:"#1a1a1a"},{name:"Marcus T.",city:"Berlin, Germany",quote:"Moving to a new city was scary, but RoommateGroups made finding a room so easy. I was settled within days.",rating:5,initials:"MT",color:"#333333"},{name:"Emily R.",city:"San Francisco, CA",quote:"I've used other platforms before, but this one actually had real, verified listings. No scams, no fake posts.",rating:5,initials:"ER",color:"#555555"}];function bi(e,t){const a=["linear-gradient(135deg, #1a1a1a 0%, #444444 100%)","linear-gradient(135deg, #1a1a1a 0%, #444444 100%)","linear-gradient(135deg, #1a1a1a 0%, #444444 100%)","linear-gradient(135deg, #1a1a1a 0%, #444444 100%)"][t%4],i=e.photos?.[0]||"",s=e.category==="roommate_wanted";return`
    <div class="listing-card">
      <div class="listing-card-image" style="background: ${i?`url('${i}') center/cover`:a}">
        ${i?"":'<div class="listing-card-image-icon"><i class="fas fa-home"></i></div>'}
        <div class="listing-type-badge">${s?"Looking for Room":e.room_type||"Private Room"}</div>
      </div>
      <div class="listing-card-body">
        <div class="listing-price">$${e.price}<span>/mo</span></div>
        <div class="listing-title">${e.title}</div>
        <div class="listing-location">
          <i class="fas fa-location-dot"></i>
          ${u.cities.findById(e.city)?.name||(e.city?e.city.replace("city_","").replace(/_/g," "):"Unknown City")}
        </div>
        <a href="/listing/${e.listing_id}" class="btn btn-outline">View Listing</a>
      </div>
    </div>
  `}function yi(e){const t=u.cities.findAll().filter(r=>r.is_active),a=r=>({name:r.name,slug:r.slug,count:Ft(r.city_id),country:u.countries.findById(r.country)?.name||r.country,state:r.state_province||"",image:r.hero_image||"",avg_rent:r.avg_rent||0,members:r.member_count||0}),i=u.cities.findAll().filter(r=>r.is_active&&r.show_in_popular!==!1).map(a);u.cities.findAll().filter(r=>r.is_active&&(r.show_in_popular_section===!0||r.show_in_popular_section===void 0&&r.show_in_popular===!0)).map(a);const s=u.fb_cities.findAll().filter(r=>r.is_popular!==!1).sort((r,w)=>(r.priority||0)-(w.priority||0)),o=u.countries.findAll().filter(r=>r.is_active);e.innerHTML=`
    <!-- Navigation -->
    ${se()}

    <!-- Hero Section -->
    <section class="hero" id="hero">
      <div class="hero-content">
        <div class="hero-badge">
          <i class="fas fa-star"></i>
          Trusted by 1.5M+ community members
        </div>
        <h1 class="hero-title animate-reveal floating-text">
          Easily Find Compatible <span class="gradient-text">Roommates</span><br>
          & List Your <span class="gradient-text">Property</span>
        </h1>
        <p class="hero-subtitle">Use our thriving community to find your ideal roommate or attract tenants to your property.</p>
        <div class="hero-search" id="hero-search">
          <div class="search-field">
            <select id="search-country" aria-label="Select country">
              <option value="">🌍 Search Country</option>
              ${o.map(r=>`<option value="${r.country_id}">${r.flag_emoji} ${r.name}</option>`).join("")}
            </select>
          </div>
          <div class="search-field">
            <select id="search-city" aria-label="Select city">
              <option value="">🏙️ Find a City...</option>
              ${t.map(r=>`<option value="${r.slug}">${r.name}</option>`).join("")}
            </select>
          </div>
          <div class="search-field">
            <select id="search-type" aria-label="Search types">
              <option value="">🏠 Rooms & More</option>
              <option value="room">Private Room</option>
              <option value="apartment">Full Apartment</option>
              <option value="sublet">Short Sublet</option>
              <option value="roommate">Roommate Wanted</option>
            </select>
          </div>
          <button class="search-btn" id="search-btn">
            <i class="fas fa-bolt"></i>
            Find Matches
          </button>
        </div>
      </div>
    </section>
    <section class="section home-cities-section" id="cities">
      <div class="container">
        <div class="section-header animate-on-scroll" style="text-align: center; margin-bottom: 48px;">
          <h2>Popular Cities</h2>
          <p>Find your next home in these top locations</p>
        </div>
        ${i.length===0?'<div class="home-cities-empty"><i class="fas fa-city"></i><p>No cities available yet. Check back soon!</p></div>':`<div class="home-cities-grid">
              ${i.map(r=>`
                <a href="/cities/${r.slug}" class="hc-card animate-on-scroll">
                  <div class="hc-img-wrap" style="${r.image?`background-image: url('${r.image}');`:""}">
                    ${r.image?"":'<div class="hc-placeholder"><i class="fas fa-city"></i></div>'}
                    <div class="hc-overlay"></div>
                  </div>
                  <div class="hc-body">
                    <div class="hc-name">${r.name}</div>
                    <div class="hc-meta">
                      <span class="hc-country">${r.state?`${r.state}, `:""}${r.country}</span>
                    </div>
                    <div class="hc-stats">
                      <span><i class="fas fa-home"></i> ${r.count.toLocaleString()} listings</span>
                      ${r.avg_rent?`<span><i class="fas fa-tag"></i> ~$${r.avg_rent.toLocaleString()}/mo</span>`:""}
                    </div>
                  </div>
                </a>
              `).join("")}
            </div>`}
      </div>
    </section>


    <!-- Popular Facebook Groups -->
    <section class="section popular-fb-groups-section" id="popular-groups">
      <div class="container">
        <div class="section-header-row animate-on-scroll">
          <div class="section-header-text">
            <h2>Popular FB Groups</h2>
            <p>Helping tenants & landlords connect for hassle-free renting</p>
          </div>
          <a href="/fb-groups" class="section-explore-link">Explore all groups <i class="fas fa-arrow-right"></i></a>
        </div>
        ${s.length===0?'<div class="home-cities-empty"><i class="fab fa-facebook"></i><p>No featured groups available. Check back soon!</p></div>':`<div class="home-cities-grid">
              ${s.map(r=>`
                <div class="hc-card animate-on-scroll">
                  <a href="${r.fb_group_link}" target="_blank" rel="noopener" class="hc-img-wrap" style="display: block;">
                    ${r.city_image?`<img src="${r.city_image}" alt="${r.fb_group_name}" loading="lazy" onerror="this.onerror=null;this.parentElement.classList.add('hc-no-img');this.remove();">`:'<div class="hc-placeholder"><i class="fab fa-facebook"></i></div>'}
                    <div class="hc-overlay"></div>
                  </a>
                  <div class="hc-body">
                    <a href="${r.fb_group_link}" target="_blank" rel="noopener" style="text-decoration: none; color: inherit;">
                      <div class="hc-name">${r.fb_group_name}</div>
                    </a>
                    <div class="hc-meta">
                      <span class="hc-country"><i class="fas fa-location-dot"></i> ${r.city_name}</span>
                    </div>
                    <div class="hc-stats">
                      <span><i class="fas fa-users"></i> ${r.total_members?r.total_members.toLocaleString():"0"}+ Members</span>
                    </div>
                    <a href="${r.fb_group_link}" target="_blank" rel="noopener" class="btn btn-outline btn-sm" style="margin-top: 18px; width: 100%; justify-content: center; display: inline-flex; align-items: center; gap: 8px; font-weight: 700;">
                      <i class="fab fa-facebook-f"></i> Join Group
                    </a>
                  </div>
                </div>
              `).join("")}
            </div>
            <div class="view-more-container animate-on-scroll" style="text-align: center; margin-top: 48px;">
              <a href="/fb-groups" class="btn btn-primary btn-lg">View All FB Groups <i class="fas fa-arrow-right" style="margin-left: 8px;"></i></a>
            </div>`}
      </div>
    </section>

    <section class="stats-section" id="stats">
      <div class="container">
        <div class="stats-container">
          <div class="stat-card" data-target="31" data-suffix="+">
            <div class="stat-icon-box">
              <i class="fas fa-globe"></i>
            </div>
            <div class="stat-number-wrapper">
              <span class="stat-number">0</span><span class="stat-suffix">+</span>
            </div>
            <div class="stat-label">CITIES</div>
          </div>

          <div class="stat-card" data-target="5" data-prefix="1." data-suffix="M+">
            <div class="stat-icon-box">
              <i class="fas fa-users"></i>
            </div>
            <div class="stat-number-wrapper">
              <span class="stat-number">1.0</span><span class="stat-suffix">M+</span>
            </div>
            <div class="stat-label">COMMUNITY MEMBERS</div>
          </div>

          <div class="stat-card" data-target="10" data-suffix="k+">
            <div class="stat-icon-box">
              <i class="fas fa-shield-halved"></i>
            </div>
            <div class="stat-number-wrapper">
              <span class="stat-number">0</span><span class="stat-suffix">k+</span>
            </div>
            <div class="stat-label">VERIFIED MEMBERS</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Feature Highlights -->
    <section class="feature-highlight-section">
      <!-- Section 1: Community -->
      <div class="feature-block">
        <div class="container">
          <div class="feature-row">
            <div class="feature-content animate-on-scroll">
              <span class="feature-tagline">
                <i class="fas fa-shield-halved"></i> SAFE & TRUSTED COMMUNITY
              </span>
              <h2 class="feature-heading">Find your perfect roommate with complete peace of mind.</h2>
              <p class="feature-subtext">We know finding a roommate can feel overwhelming. That's why every listing and profile on RoommateGroups is carefully moderated to keep you safe from scams and fraud.</p>
              
              <ul class="feature-checklist">
                <li><i class="fas fa-check-circle"></i> All listings manually moderated</li>
                <li><i class="fas fa-check-circle"></i> Scam-free verified environment</li>
                <li><i class="fas fa-check-circle"></i> Secure chat via Facebook Messenger</li>
                <li><i class="fas fa-check-circle"></i> Active in 31+ cities worldwide</li>
              </ul>
              
              <a href="/safety" class="feature-cta">Learn more about our community →</a>
            </div>
            <div class="feature-image animate-on-scroll">
              <div class="image-wrapper">
                <img src="/src/assets/img/community.png" alt="Happy roommates in a shared living space">
                <div class="image-accent-glow"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Section 2: Listings -->
      <div class="feature-block section-light">
        <div class="container">
          <div class="feature-row reverse">
            <div class="feature-content animate-on-scroll">
              <span class="feature-tagline">
                <i class="fas fa-list-check"></i> LISTINGS & CONNECTIONS
              </span>
              <h2 class="feature-heading">Connect with 1.5M+ community members looking for the same thing.</h2>
              <p class="feature-subtext">Whether you're a student, a working professional, or a landlord — our platform connects you with genuine, relevant matches fast. No endless scrolling, no wasted time.</p>
              
              <ul class="feature-checklist grid-2-col">
                <li><i class="fas fa-check-circle"></i> 10,000+ verified members</li>
                <li><i class="fas fa-check-circle"></i> Students & professionals</li>
                <li><i class="fas fa-check-circle"></i> Furnished room options</li>
                <li><i class="fas fa-check-circle"></i> Budget-friendly matches</li>
                <li><i class="fas fa-check-circle"></i> Landlord-friendly tools</li>
                <li><i class="fas fa-check-circle"></i> Global city coverage</li>
              </ul>
              
              <a href="/search/rooms" class="feature-cta">Explore listings →</a>
            </div>
            <div class="feature-image animate-on-scroll">
              <div class="image-wrapper">
                <img src="/src/assets/img/mockup.png" alt="RoommateGroups Dashboard and Map Mockup">
                <div class="image-accent-glow-secondary"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- How It Works -->
    <section class="section section-light" id="how-it-works">
      <div class="container">
        <div class="section-header animate-on-scroll">
          <h2>How It Works</h2>
          <p>Finding your next room or roommate is as easy as 1-2-3</p>
        </div>
        <div class="steps-grid">
          <div class="step-card animate-on-scroll">
            <div class="step-icon">
              <i class="fas fa-magnifying-glass"></i>
              <div class="step-number">1</div>
            </div>
            <h3>Search</h3>
            <p>Browse rooms and roommate profiles in your desired city. Filter by price, location, and preferences.</p>
          </div>
          <div class="step-card animate-on-scroll">
            <div class="step-icon">
              <i class="fas fa-comments"></i>
              <div class="step-number">2</div>
            </div>
            <h3>Connect</h3>
            <p>Message verified members directly through our secure platform. Get to know potential roommates.</p>
          </div>
          <div class="step-card animate-on-scroll">
            <div class="step-icon">
              <i class="fas fa-house-circle-check"></i>
              <div class="step-number">3</div>
            </div>
            <h3>Move In</h3>
            <p>Find your perfect match and move in with confidence. Join thousands of happy renters worldwide.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Featured Listings -->
    <section class="section" id="listings">
      <div class="container">
        <div class="section-header animate-on-scroll">
          <h2>Listings</h2>
          <p>Hand-picked rooms and apartments from our verified hosts</p>
        </div>
        ${u.listings.find(r=>r.status==="active").length>0?`
        <div class="listings-wrapper">
          <div class="listings-track" id="listings-track">
            ${u.listings.find(r=>r.status==="active").slice(0,6).map((r,w)=>bi(r,w)).join("")}
          </div>
        </div>
        <div class="carousel-controls">
          <button class="carousel-btn" id="carousel-prev" aria-label="Previous listings">
            <i class="fas fa-chevron-left"></i>
          </button>
          <button class="carousel-btn" id="carousel-next" aria-label="Next listings">
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
        `:`
        <div style="text-align:center;padding:60px 20px;color:#64748b;">
          <i class="fas fa-home" style="font-size:2.5rem;margin-bottom:16px;display:block;opacity:0.4;"></i>
          <p style="font-size:1.1rem;margin-bottom:16px;">No listings available yet. Be the first to list!</p>
          <a href="/post-listing" class="btn btn-primary">Post a Listing</a>
        </div>
        `}
      </div>
    </section>

    <!-- Testimonials -->
    <section class="section section-light" id="testimonials">
      <div class="container">
        <div class="section-header animate-on-scroll">
          <h2>What Our Members Say</h2>
          <p>Hear from real people who found their perfect living situation</p>
        </div>
        <div class="testimonials-carousel-container">
          <div class="testimonials-marquee marquee-ltr">
            ${[...Oe,...Oe,...Oe,...Oe].map(r=>`
              <div class="testimonial-card glass-card">
                <div class="glass-orb"></div>
                <i class="fas fa-quote-right quote-icon"></i>
                <div class="testimonial-stars">
                  ${Array(r.rating).fill('<i class="fas fa-star"></i>').join("")}
                </div>
                <p class="testimonial-quote">"${r.quote}"</p>
                <div class="testimonial-author">
                  <div class="testimonial-avatar" style="background: linear-gradient(45deg, ${r.color}, ${r.color}dd)">
                    ${r.initials}
                  </div>
                  <div class="author-info">
                    <div class="testimonial-name">${r.name}</div>
                    <div class="testimonial-city">${r.city}</div>
                  </div>
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="cta-section" id="cta">
      <div class="container">
        <div class="cta-content animate-on-scroll">
          <h2>List Your Room for Free</h2>
          <p>Reach thousands of verified renters looking for their next home. No fees, no hassle.</p>
          <a href="/post-listing" class="btn btn-white btn-lg">
            <i class="fas fa-plus"></i>
            Post a Listing
          </a>
        </div>
      </div>
    </section>

    <!-- FAQ Section -->
    <section class="section home-faq-section" id="faq">
      <div class="container">
        <div class="section-header animate-on-scroll">
          <h2>Frequently Asked Questions</h2>
          <p>Everything you need to know about RoommateGroups</p>
        </div>
        <div class="home-faq-list">
          ${[{q:"How do I join a group?",a:"Click on the city you're interested in, then click the link to join the corresponding Facebook group."},{q:"Can I find roommates for short-term stays?",a:"Yes, many groups cater to both short-term and long-term housing needs."},{q:"How does Roommate Groups help me find roommates?",a:"Roommate Groups is a membership platform that connects you with potential roommates through dedicated Facebook groups. Once you join, you'll gain access to these groups where you can interact with other members, post about your roommate search, and browse listings from others looking for roommates in your area."},{q:"Is there a fee to use Roommate Groups?",a:"Yes, Roommate Groups operates on a membership model. By paying a fee, you gain access to our curated Facebook groups where you can connect with potential roommates. This membership helps ensure that all users are serious about finding roommates and maintains the quality of our community."},{q:"How do I make a payment for subscription services?",a:"Follow the call-to-action link for payment on each group's page, and the information will be processed accordingly."}].map(r=>`
            <div class="home-faq-item animate-on-scroll">
              <div class="home-faq-icon"><i class="fas fa-question-circle"></i></div>
              <div class="home-faq-content">
                <div class="home-faq-q">${r.q}</div>
                <div class="home-faq-a">${r.a}</div>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    </section>

    ${ge()}
  `,ce();const n=document.getElementById("listings-track"),l=document.getElementById("carousel-prev"),d=document.getElementById("carousel-next"),v=320;l&&n&&l.addEventListener("click",()=>{n.scrollBy({left:-v,behavior:"smooth"})}),d&&n&&d.addEventListener("click",()=>{n.scrollBy({left:v,behavior:"smooth"})});const b={root:null,rootMargin:"0px 0px -60px 0px",threshold:.1},y=new IntersectionObserver(r=>{r.forEach(w=>{w.isIntersecting&&(w.target.classList.add("visible"),y.unobserve(w.target))})},b);document.querySelectorAll(".animate-on-scroll").forEach(r=>y.observe(r)),document.querySelectorAll('a[href^="#"]').forEach(r=>{const w=r.getAttribute("href");w.startsWith("#/")||r.addEventListener("click",S=>{S.preventDefault();const A=document.querySelector(w);A&&A.scrollIntoView({behavior:"smooth",block:"start"})})});const g=document.getElementById("search-country"),f=document.getElementById("search-city");g.addEventListener("change",()=>{const r=g.value,w=r?t.filter(S=>S.country===r):t;f.innerHTML='<option value="">Select City</option>'+w.map(S=>`<option value="${S.slug}">${S.name}</option>`).join("")});const h=document.getElementById("search-btn");h&&h.addEventListener("click",()=>{const r=g.value,w=f.value,S=document.getElementById("search-type").value;if(w||r){const A=new URLSearchParams;r&&A.set("country",r),w&&A.set("city",w),S&&A.set("type",S),X("/search/rooms?"+A.toString())}else f.focus(),f.classList.add("error-shake"),setTimeout(()=>f.classList.remove("error-shake"),500)});const c=(r,w,S,A,_="",$="")=>{let E=null;const T=j=>{E||(E=j);const M=Math.min((j-E)/A,1),F=(1-Math.pow(1-M,4))*(S-w)+w;_==="1."?r.textContent=`1.${Math.floor(F)}`:r.textContent=Math.floor(F),M<1&&window.requestAnimationFrame(T)};window.requestAnimationFrame(T)},m=new IntersectionObserver(r=>{r.forEach(w=>{w.isIntersecting&&(w.target.querySelectorAll(".stat-card").forEach(A=>{const _=A.querySelector(".stat-number"),$=parseFloat(A.dataset.target),E=A.dataset.prefix||"",T=A.dataset.suffix||"";c(_,0,$,1800,E,T);const M=A.querySelector(".stat-progress-bar");M&&(M.style.width=M.style.getPropertyValue("--width"))}),m.unobserve(w.target))})},{threshold:.3}),p=document.getElementById("stats");p&&m.observe(p)}function xi(e){e.innerHTML=`
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-header">
          <a href="/" class="auth-logo">
            <span class="logo-badge"><span class="logo-badge-left">Roommate</span><span class="logo-badge-right">Groups</span></span>
          </a>
          <h1>Create your account</h1>
          <p>Join 1.5M+ members finding their perfect room</p>
        </div>

        <div class="auth-divider"><span>register with email</span></div>

        <!-- Registration Form -->
        <form class="auth-form" id="register-form" novalidate>
          <div class="form-group">
            <label for="reg-name">Full Name</label>
            <div class="input-wrapper">
              <i class="fas fa-user"></i>
              <input type="text" id="reg-name" class="form-input" placeholder="John Doe" required autocomplete="name" />
            </div>
            <div class="form-error" id="name-error"></div>
          </div>

          <div class="form-group">
            <label for="reg-email">Email Address</label>
            <div class="input-wrapper">
              <i class="fas fa-envelope"></i>
              <input type="email" id="reg-email" class="form-input" placeholder="you@example.com" required autocomplete="email" inputmode="email" />
            </div>
            <div class="form-error" id="email-error"></div>
          </div>

          <div class="form-group">
            <label for="reg-password">Password</label>
            <div class="input-wrapper">
              <i class="fas fa-lock"></i>
              <input type="password" id="reg-password" class="form-input" placeholder="Min. 8 characters" required autocomplete="new-password" />
              <button type="button" class="password-toggle" id="password-toggle" aria-label="Toggle password visibility">
                <i class="fas fa-eye"></i>
              </button>
            </div>
            <div class="password-strength-meter">
              <div class="strength-bar" id="strength-bar"></div>
              <span class="strength-label" id="strength-label"></span>
            </div>
            <div class="form-error" id="password-error"></div>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" id="reg-terms" required />
              <span class="checkmark"></span>
              I agree to the <a href="/terms" class="auth-link">Terms of Service</a> and <a href="/privacy" class="auth-link">Privacy Policy</a>
            </label>
            <div class="form-error" id="terms-error"></div>
          </div>

          <button type="submit" class="btn btn-primary btn-lg auth-submit" id="register-btn">
            Create Account
          </button>
        </form>

        <div class="auth-footer">
          Already have an account? <a href="/auth/login" class="auth-link">Sign in</a>
        </div>
      </div>
    </div>

    <!-- Toast notification -->
    <div class="toast" id="toast"></div>
  `;const t=document.getElementById("register-form"),a=document.getElementById("reg-name"),i=document.getElementById("reg-email"),s=document.getElementById("reg-password"),o=document.getElementById("password-toggle"),n=document.getElementById("strength-bar"),l=document.getElementById("strength-label");setTimeout(()=>a?.focus(),50),o.addEventListener("click",()=>{const d=s.getAttribute("type")==="password"?"text":"password";s.setAttribute("type",d),o.querySelector("i").className=d==="password"?"fas fa-eye":"fas fa-eye-slash"}),s.addEventListener("input",()=>{const d=fi(s.value);n.style.width=d.percent+"%",n.style.backgroundColor=d.color,l.textContent=d.label,l.style.color=d.color}),i.addEventListener("blur",()=>{const d=i.value.trim();d&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d)?ke("email-error",i,"Please enter a valid email address."):wi("email-error",i)}),t.addEventListener("submit",d=>{d.preventDefault(),_i();const v=a.value.trim(),b=i.value.trim(),y=s.value,g=document.getElementById("reg-terms").checked;let f=!0;if(v||(ke("name-error",a,"Please enter your full name."),f=!1),(!b||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b))&&(ke("email-error",i,"Please enter a valid email address."),f=!1),y?y.length<8&&(ke("password-error",s,"Password must be at least 8 characters."),f=!1):(ke("password-error",s,"Password is required."),f=!1),g||(ke("terms-error",null,"You must agree to the terms."),f=!1),!f)return;const h=document.getElementById("register-btn");h.disabled=!0,h.innerHTML='<i class="fas fa-spinner fa-spin"></i> Creating account...',setTimeout(async()=>{const c=await ui({fullName:v,email:b,password:y});if(!c.success){ke("email-error",i,c.error),h.disabled=!1,h.textContent="Create Account";return}ki("Account created! Welcome to RoommateGroups.","success"),setTimeout(()=>{X("/profile-setup")},1500)},800)})}function ke(e,t,a){if(e){const i=document.getElementById(e);i&&(i.textContent=a||"",i.classList.toggle("visible",!!a))}t&&t.classList.toggle("input-error",!!a)}function wi(e,t){ke(e,t,null)}function _i(){document.querySelectorAll(".form-error").forEach(e=>{e.textContent="",e.classList.remove("visible")}),document.querySelectorAll(".input-error").forEach(e=>e.classList.remove("input-error"))}function ki(e,t="info"){const a=document.getElementById("toast");a&&(a.textContent=e,a.className=`toast toast-${t} visible`,setTimeout(()=>a.classList.remove("visible"),4e3))}const Si=5,qi=30*1e3,pt="rg_login_attempts";function Ot(){try{return JSON.parse(localStorage.getItem(pt))||{count:0,lockUntil:0}}catch{return{count:0,lockUntil:0}}}function Li(e){localStorage.setItem(pt,JSON.stringify(e))}function $i(){const e=Ot();return e.count+=1,e.count>=Si&&(e.lockUntil=Date.now()+qi),Li(e),e}function At(){localStorage.removeItem(pt)}function Ge(){const e=Ot();return e.lockUntil?Math.max(0,Math.ceil((e.lockUntil-Date.now())/1e3)):0}function Ei(e){e.innerHTML=`
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-header">
          <a href="/" class="auth-logo">
            <span class="logo-badge"><span class="logo-badge-left">Roommate</span><span class="logo-badge-right">Groups</span></span>
          </a>
          <h1>Welcome back</h1>
          <p>Sign in to find your perfect room or roommate</p>
        </div>

        <div class="auth-divider"><span>sign in with email</span></div>

        <!-- Login Form -->
        <form class="auth-form" id="login-form" novalidate>
          <div class="form-group">
            <label for="login-email">Email Address</label>
            <div class="input-wrapper">
              <i class="fas fa-envelope"></i>
              <input type="email" id="login-email" class="form-input" placeholder="you@example.com"
                required autocomplete="email" inputmode="email" />
            </div>
            <div class="form-error" id="email-error"></div>
          </div>

          <div class="form-group">
            <div class="label-row">
              <label for="login-password">Password</label>
            </div>
            <div class="input-wrapper">
              <i class="fas fa-lock"></i>
              <input type="password" id="login-password" class="form-input" placeholder="••••••••"
                required autocomplete="current-password" />
              <button type="button" class="password-toggle" id="password-toggle" aria-label="Toggle password visibility">
                <i class="fas fa-eye"></i>
              </button>
            </div>
            <div class="form-error" id="password-error"></div>
          </div>



          <div class="form-row">
            <label class="checkbox-label">
              <input type="checkbox" id="remember-me" />
              <span class="checkmark"></span>
              Remember me
            </label>
            <a href="/auth/forgot-password" class="auth-link forgot-link">Forgot Password?</a>
          </div>

          <div class="form-error form-error-global" id="global-error"></div>
          <div class="login-lockout-msg" id="lockout-msg" style="display:none;"></div>

          <button type="submit" class="btn btn-primary btn-lg auth-submit" id="login-btn">
            Sign In
          </button>
        </form>

        <div class="auth-footer">
          Don't have an account? <a href="/auth/register" class="auth-link">Sign up</a>
        </div>
      </div>
    </div>

    <div class="toast" id="toast"></div>
  `;const t=document.getElementById("login-email"),a=document.getElementById("login-password"),i=document.getElementById("login-form"),s=document.getElementById("login-btn"),o=document.getElementById("lockout-msg"),n=document.getElementById("password-toggle");setTimeout(()=>t?.focus(),50),l(),n.addEventListener("click",()=>{const b=a.getAttribute("type")==="password"?"text":"password";a.setAttribute("type",b),n.querySelector("i").className=b==="password"?"fas fa-eye":"fas fa-eye-slash"}),t.addEventListener("blur",()=>{const b=t.value.trim();b&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b)?Ce("email-error",t,"Please enter a valid email address."):Ai("email-error",t)}),i.addEventListener("submit",async b=>{b.preventDefault(),Ci();const y=Ge();if(y>0){d(y);return}const g=t.value.trim(),f=a.value;let h=!0;g?/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(g)||(Ce("email-error",t,"Please enter a valid email address."),h=!1):(Ce("email-error",t,"Email address is required."),h=!1),f||(Ce("password-error",a,"Password is required."),h=!1),h&&(v(!0),setTimeout(async()=>{const c=await Nt(g,f);if(!c.success){$i();const m=Ge();m>0?d(m):c.error.includes("Password")?Ce("password-error",a,c.error):Ce("global-error",null,c.error),v(!1);return}At(),Ti("Welcome back!","success"),setTimeout(()=>{X(c.user.profileComplete?"/dashboard":"/profile-setup")},800)},500))});function l(){const b=Ge();b>0&&d(b)}function d(b){o.style.display="flex",o.innerHTML=`<i class="fas fa-clock"></i> Too many attempts. Try again in <strong id="lockout-count">${b}s</strong>`,s.disabled=!0,s.textContent="Sign In";const y=setInterval(()=>{const g=Ge(),f=document.getElementById("lockout-count");g<=0?(clearInterval(y),o.style.display="none",s.disabled=!1,At()):f&&(f.textContent=g+"s")},1e3)}function v(b){s.disabled=b,s.innerHTML=b?'<i class="fas fa-spinner fa-spin"></i> Signing in...':"Sign In"}}function Ce(e,t,a){if(e){const i=document.getElementById(e);i&&(i.textContent=a||"",i.classList.toggle("visible",!!a))}t&&t.classList.toggle("input-error",!!a)}function Ai(e,t){Ce(e,t,null)}function Ci(){document.querySelectorAll(".form-error").forEach(t=>{t.textContent="",t.classList.remove("visible")}),document.querySelectorAll(".input-error").forEach(t=>t.classList.remove("input-error"));const e=document.getElementById("lockout-msg");e&&(e.style.display="none")}function Ti(e,t="info"){const a=document.getElementById("toast");a&&(a.textContent=e,a.className=`toast toast-${t} visible`,setTimeout(()=>a.classList.remove("visible"),4e3))}function Ii(e){e.innerHTML=`
    <div class="auth-page">
      <div class="auth-card auth-card-narrow">
        <div class="auth-header">
          <a href="/" class="auth-logo">
            <span class="logo-badge"><span class="logo-badge-left">Roommate</span><span class="logo-badge-right">Groups</span></span>
          </a>
          <div class="auth-icon-circle">
            <i class="fas fa-key"></i>
          </div>
          <h1>Forgot your password?</h1>
          <p>Enter your email and we'll send you a reset link</p>
        </div>

        <!-- Reset Form -->
        <form class="auth-form" id="forgot-form" novalidate>
          <div class="form-group">
            <label for="forgot-email">Email Address</label>
            <div class="input-wrapper">
              <i class="fas fa-envelope"></i>
              <input type="email" id="forgot-email" class="form-input" placeholder="you@example.com" required autocomplete="email" />
            </div>
            <div class="form-error" id="email-error"></div>
          </div>

          <button type="submit" class="btn btn-primary btn-lg auth-submit" id="reset-btn">
            Send Reset Link
          </button>
        </form>

        <!-- Success State (hidden initially) -->
        <div class="forgot-success" id="forgot-success" style="display:none;">
          <div class="success-icon">
            <i class="fas fa-envelope-circle-check"></i>
          </div>
          <h2>Check your email</h2>
          <p>We've sent a password reset link to <strong id="sent-email"></strong>. Check your inbox and follow the link to reset your password.</p>
          <a href="/auth/login" class="btn btn-outline btn-lg auth-submit">
            Back to Sign In
          </a>
        </div>

        <div class="auth-footer">
          Remember your password? <a href="/auth/login" class="auth-link">Sign in</a>
        </div>
      </div>
    </div>
  `;const t=document.getElementById("forgot-form");t.addEventListener("submit",a=>{a.preventDefault();const s=document.getElementById("forgot-email").value.trim(),o=document.getElementById("email-error");if(o.textContent="",o.classList.remove("visible"),!s||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)){o.textContent="Please enter a valid email address.",o.classList.add("visible");return}const n=document.getElementById("reset-btn");n.disabled=!0,n.innerHTML='<i class="fas fa-spinner fa-spin"></i> Sending...',setTimeout(()=>{t.style.display="none";const l=document.getElementById("forgot-success");l.style.display="block",document.getElementById("sent-email").textContent=s},1200)})}async function Pe(e,t="image.webp"){const a=new FormData;a.append("image",e,t);try{const i=await fetch("/api/upload",{method:"POST",body:a});if(!i.ok)throw new Error(`Upload failed with status ${i.status}`);const s=await i.json();if(s.success)return s.url;throw new Error(s.error||"Upload failed")}catch(i){throw console.error("[UPLOAD SERVICE ERROR]",i),i}}const Mi=[{id:"clean",label:"Clean",icon:"fa-broom"},{id:"social",label:"Social",icon:"fa-users"},{id:"quiet",label:"Quiet",icon:"fa-volume-xmark"},{id:"early-bird",label:"Early Bird",icon:"fa-sun"},{id:"night-owl",label:"Night Owl",icon:"fa-moon"},{id:"pet-friendly",label:"Pet-Friendly",icon:"fa-paw"},{id:"non-smoker",label:"Non-Smoker",icon:"fa-ban-smoking"},{id:"fitness",label:"Fitness Enthusiast",icon:"fa-dumbbell"},{id:"remote-worker",label:"Remote Worker",icon:"fa-laptop-house"},{id:"student",label:"Student",icon:"fa-graduation-cap"}];function Bi(e){const t=ee();if(!t){X("/auth/login");return}e.innerHTML=`
    <div class="auth-page profile-setup-page">
      <div class="auth-card auth-card-wide">
        <div class="auth-header">
          <div class="auth-logo no-link">
            <span class="logo-badge"><span class="logo-badge-left">Roommate</span><span class="logo-badge-right">Groups</span></span>
          </div>
          <h1>Complete Your Profile</h1>
          <p>Help potential roommates get to know you better</p>
        </div>

        <form class="auth-form profile-form" id="profile-form" novalidate>
          <!-- Photo Upload -->
          <div class="form-group form-group-centered">
            <div class="photo-upload" id="photo-upload">
              <div class="photo-preview" id="photo-preview">
                <i class="fas fa-camera"></i>
                <span>Upload Photo</span>
              </div>
              <input type="file" id="photo-input" accept="image/*" hidden />
            </div>
          </div>

          <!-- Bio -->
          <div class="form-group">
            <label for="profile-bio">About Me</label>
            <textarea id="profile-bio" class="form-input form-textarea" placeholder="Tell potential roommates about yourself..." maxlength="500" rows="4">${t.bio||""}</textarea>
            <div class="char-counter">
              <span id="bio-count">${(t.bio||"").length}</span>/500
            </div>
          </div>

          <!-- Two-column row -->
          <div class="form-row-2col">
            <div class="form-group">
              <label for="profile-age">Age Range</label>
              <div class="input-wrapper">
                <i class="fas fa-cake-candles"></i>
                <select id="profile-age" class="form-input form-select">
                  <option value="">Select age range</option>
                  <option value="18-24" ${t.age_range==="18-24"?"selected":""}>18-24</option>
                  <option value="25-30" ${t.age_range==="25-30"?"selected":""}>25-30</option>
                  <option value="31-35" ${t.age_range==="31-35"?"selected":""}>31-35</option>
                  <option value="36-40" ${t.age_range==="36-40"?"selected":""}>36-40</option>
                  <option value="41+" ${t.age_range==="41+"?"selected":""}>41+</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label for="profile-occupation">Occupation</label>
              <div class="input-wrapper">
                <i class="fas fa-briefcase"></i>
                <input type="text" id="profile-occupation" class="form-input" placeholder="e.g. Software Engineer" value="${t.occupation||""}" />
              </div>
            </div>
          </div>

          <!-- Country & City -->
          <div class="form-row-2col">
            <div class="form-group">
              <label for="profile-country">Country <span style="color:#e53e3e">*</span></label>
              <div class="input-wrapper">
                <i class="fas fa-globe"></i>
                <select id="profile-country" class="form-input form-select" required>
                  <option value="">Select your country</option>
                  ${u.countries.findAll().filter(p=>p.is_active).sort((p,r)=>p.name.localeCompare(r.name)).map(p=>`<option value="${p.country_id}" ${t.country===p.country_id?"selected":""}>${p.flag_emoji?p.flag_emoji+" ":""}${p.name}</option>`).join("")}
                </select>
              </div>
              <div class="form-error" id="profile-country-error"></div>
            </div>

            <div class="form-group">
              <label for="profile-city">City <span style="color:#e53e3e">*</span></label>
              <div class="input-wrapper">
                <i class="fas fa-location-dot"></i>
                <select id="profile-city" class="form-input form-select" required disabled>
                  <option value="">Select a country first</option>
                </select>
              </div>
              <div class="form-error" id="profile-city-error"></div>
            </div>
          </div>

          <!-- Lifestyle Tags -->
          <div class="form-group">
            <label>Lifestyle &amp; Preferences</label>
            <p class="form-hint">Select all that apply</p>
            <div class="lifestyle-tags" id="lifestyle-tags">
              ${Mi.map(p=>`
                <label class="tag-pill ${(t.lifestyle_tags||[]).includes(p.id)?"active":""}">
                  <input type="checkbox" value="${p.id}" ${(t.lifestyle_tags||[]).includes(p.id)?"checked":""} />
                  <i class="fas ${p.icon}"></i>
                  ${p.label}
                </label>
              `).join("")}
            </div>
          </div>

          <!-- Budget Range -->
          <div class="form-group">
            <label>Monthly Budget</label>
            <div class="budget-display">
              <span id="budget-min-display">$${t.budgetMin||500}</span>
              <span class="budget-separator">—</span>
              <span id="budget-max-display">$${t.budgetMax||2500}</span>
            </div>
            <div class="range-slider-container">
              <input type="range" id="budget-min" class="range-slider" min="0" max="5000" step="100" value="${t.budgetMin||500}" />
              <input type="range" id="budget-max" class="range-slider" min="0" max="5000" step="100" value="${t.budgetMax||2500}" />
              <div class="range-track">
                <div class="range-fill" id="range-fill"></div>
              </div>
            </div>
            <div class="range-labels">
              <span>$0</span>
              <span>$5,000</span>
            </div>
          </div>

          <!-- Move-in Timeline -->
          <div class="form-group">
            <label for="profile-timeline">Move-in Timeline</label>
            <div class="input-wrapper">
              <i class="fas fa-calendar-days"></i>
              <select id="profile-timeline" class="form-input form-select">
                <option value="">When are you looking to move?</option>
                <option value="asap" ${t.moveInTimeline==="asap"?"selected":""}>As soon as possible</option>
                <option value="1-month" ${t.moveInTimeline==="1-month"?"selected":""}>Within 1 month</option>
                <option value="1-3-months" ${t.moveInTimeline==="1-3-months"?"selected":""}>1-3 months</option>
                <option value="3-6-months" ${t.moveInTimeline==="3-6-months"?"selected":""}>3-6 months</option>
                <option value="flexible" ${t.moveInTimeline==="flexible"?"selected":""}>Flexible</option>
              </select>
            </div>
          </div>

          <button type="submit" class="btn btn-primary btn-lg auth-submit" id="save-profile-btn">
            Save &amp; Continue
          </button>

        </form>
      </div>
    </div>

    <div class="toast" id="toast"></div>
  `;const a=document.getElementById("photo-upload"),i=document.getElementById("photo-input"),s=document.getElementById("photo-preview");t.profile_photo&&(s.innerHTML=`<img src="${t.profile_photo}" alt="Profile photo" />`,s.dataset.photo=t.profile_photo),a.addEventListener("click",()=>i.click()),i.addEventListener("change",async p=>{const r=p.target.files[0];if(r){if(r.size>5*1024*1024){Ee("Image must be smaller than 5MB","error");return}s.innerHTML='<i class="fas fa-spinner fa-spin"></i>';try{const w=await Pe(r,"profile.jpg");s.innerHTML=`<img src="${w}" alt="Profile photo" />`,s.dataset.photo=w,Ee("Photo uploaded successfully","success")}catch(w){console.warn("[PROFILE] Server upload failed, falling back to Base64:",w);const S=new FileReader;S.onload=A=>{const _=A.target.result;s.innerHTML=`<img src="${_}" alt="Profile photo" />`,s.dataset.photo=_,Ee("Server unavailable. Photo saved locally.","warning")},S.onerror=()=>{Ee("Upload failed: "+w.message,"error"),s.innerHTML='<i class="fas fa-camera"></i><span>Upload Photo</span>'},S.readAsDataURL(r)}}});const o=document.getElementById("profile-country"),n=document.getElementById("profile-city");document.getElementById("save-profile-btn");function l(p,r=""){n.innerHTML='<option value="">Loading cities...</option>',n.disabled=!0;const w=u.cities.find(S=>S.country===p&&S.is_active!==!1).sort((S,A)=>S.name.localeCompare(A.name));w.length===0?n.innerHTML='<option value="">No cities available</option>':(n.innerHTML='<option value="">Select your city</option>',w.forEach(S=>{const A=document.createElement("option");A.value=S.city_id,A.textContent=S.name,S.city_id===r&&(A.selected=!0),n.appendChild(A)}),n.disabled=!1)}function d(p,r,w){const S=document.getElementById(p);S&&(S.textContent=w||"",S.classList.toggle("visible",!!w)),r&&r.classList.toggle("input-error",!!w)}t.country&&l(t.country,t.city||""),o.addEventListener("change",()=>{const p=o.value;d("profile-country-error",o,""),d("profile-city-error",n,""),p?l(p):(n.innerHTML='<option value="">Select a country first</option>',n.disabled=!0)}),n.addEventListener("change",()=>{d("profile-city-error",n,"")});const v=document.getElementById("profile-bio"),b=document.getElementById("bio-count");v.addEventListener("input",()=>{b.textContent=v.value.length,b.style.color=v.value.length>480?"#1a1a1a":""}),document.querySelectorAll(".tag-pill").forEach(p=>{p.addEventListener("click",()=>{});const r=p.querySelector('input[type="checkbox"]');r.addEventListener("change",()=>{p.classList.toggle("active",r.checked)})});const y=document.getElementById("budget-min"),g=document.getElementById("budget-max"),f=document.getElementById("budget-min-display"),h=document.getElementById("budget-max-display"),c=document.getElementById("range-fill");function m(){let p=parseInt(y.value),r=parseInt(g.value);p>r&&([y.value,g.value]=[r,p],[p,r]=[r,p]),f.textContent=`$${p.toLocaleString()}`,h.textContent=`$${r.toLocaleString()}`;const w=p/5e3*100,S=r/5e3*100;c.style.left=w+"%",c.style.width=S-w+"%"}y.addEventListener("input",m),g.addEventListener("input",m),m(),document.getElementById("profile-form").addEventListener("submit",p=>{p.preventDefault();const r=o.value,w=n.value;let S=!0;if(r||(d("profile-country-error",o,"Please select your country."),S=!1),w||(d("profile-city-error",n,"Please select your city."),S=!1),!S){Ee("Please fill in all required fields.","error");return}const A=[];document.querySelectorAll(".tag-pill input:checked").forEach(E=>{A.push(E.value)});const _={profilePhoto:s.dataset.photo||t.profile_photo||"",bio:v.value.trim(),ageRange:document.getElementById("profile-age").value,occupation:document.getElementById("profile-occupation").value.trim(),lifestyleTags:A,budgetMin:parseInt(y.value),budgetMax:parseInt(g.value),moveInTimeline:document.getElementById("profile-timeline").value,country:r,city:w},$=document.getElementById("save-profile-btn");$.disabled=!0,$.innerHTML='<i class="fas fa-spinner fa-spin"></i> Saving...',setTimeout(()=>{mi(t.id,_).success?(Ee("Profile saved successfully!","success"),setTimeout(()=>X("/dashboard"),1200)):(Ee("Failed to save profile.","error"),$.disabled=!1,$.textContent="Save & Continue")},600)})}function Ee(e,t="info"){const a=document.getElementById("toast");a.textContent=e,a.className=`toast toast-${t} visible`,setTimeout(()=>a.classList.remove("visible"),4e3)}let ze=null;function _e(e){ze&&(clearInterval(ze),ze=null);const t=ee();if(!t){X("/auth/login");return}const a=(window.location.pathname||"/dashboard").split("?")[0],i=u.users.findById(t.id);let s="overview";a==="/dashboard/listings"&&(s="listings"),a==="/dashboard/messages"&&(s="messages"),a==="/dashboard/saved"&&(s="saved"),a==="/dashboard/searches"&&(s="searches"),a==="/dashboard/verification"&&(s="verification"),a==="/dashboard/subscription"&&(s="subscription"),a==="/dashboard/settings"&&(s="settings"),a==="/dashboard/notifications"&&(s="notifications");const o=i.profile_photo||"https://ui-avatars.com/api/?name="+encodeURIComponent(i.display_name)+"&background=1B4F72&color=fff&size=80",n=i.subscription_tier||"free",l={free:"Free",basic:"Basic",premium:"Premium",pro:"Pro"};function d(m,p,r,w,S){const A=s===w?"active":"";return'<a href="'+m+'" class="sidebar-link '+A+'"><span class="link-icon"><i class="fa-solid '+p+'"></i></span>'+r+(S||"")+"</a>"}e.innerHTML=['<div class="dashboard-layout">','<aside class="dashboard-sidebar" id="dashboard-sidebar">','<div class="sidebar-header">','<a href="/" class="sidebar-logo"><span class="logo-badge"><span class="logo-badge-left">Roommate</span><span class="logo-badge-right">Groups</span></span></a>','<button class="mobile-menu-close" id="sidebar-close"><i class="fa-solid fa-xmark"></i></button>',"</div>",'<div class="sidebar-user">','<div class="sidebar-user-wrap">','<img src="'+o+'" alt="Avatar" class="sidebar-avatar">',"<div>",'<div class="sidebar-user-name">'+K(i.display_name)+"</div>",'<div class="sidebar-user-tier tier-'+n+'">'+(n!=="free"?'<i class="fa-solid fa-bolt" style="font-size:0.6rem;"></i> ':"")+l[n]+" Plan</div>","</div>","</div>","</div>",'<nav class="sidebar-nav">','<div class="sidebar-nav-section">Menu</div>',d("/dashboard","fa-house","Overview","overview"),d("/dashboard/listings","fa-list-ul","My Listings","listings"),d("/dashboard/messages","fa-message","Messages","messages",Ri(i.user_id)),d("/dashboard/notifications","fa-bell","Notifications","notifications",Pi(i.user_id)),d("/dashboard/saved","fa-heart","Saved Listings","saved"),d("/dashboard/searches","fa-magnifying-glass","Saved Searches","searches"),'<div class="sidebar-nav-section" style="margin-top:4px;">Account</div>',d("/dashboard/verification","fa-shield-halved","Verification","verification"),d("/dashboard/subscription","fa-credit-card","Subscription","subscription"),d("/dashboard/settings","fa-gear","Settings","settings"),i.role==="admin"?'<div class="sidebar-nav-section" style="margin-top:4px;">Admin</div>'+d("/admin","fa-lock","Admin Panel",""):"","</nav>",'<div class="sidebar-footer">','<button id="btn-signout" class="sidebar-link" style="color:#1a1a1a;"><span class="link-icon" style="color:#1a1a1a;"><i class="fa-solid fa-arrow-right-from-bracket"></i></span> Sign Out</button>',"</div>","</aside>",'<div class="sidebar-backdrop" id="sidebar-backdrop"></div>','<main class="dashboard-main">','<div class="dashboard-topbar mobile-only">','<button id="sidebar-toggle" class="btn btn-icon" style="background:none;border:1px solid var(--border);width:36px;height:36px;border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;"><i class="fa-solid fa-bars" style="font-size:0.9rem;color:var(--text-secondary);"></i></button>','<div class="topbar-logo"><i class="fa-solid fa-house-chimney" style="color:var(--primary);margin-right:6px;"></i>Dashboard</div>','<div style="display:flex;align-items:center;gap:8px;">','<a href="/dashboard/notifications" class="nav-msg-btn" style="position:relative;" title="Notifications">','<i class="fa-solid fa-bell" style="font-size:1rem;color:var(--text-secondary);"></i>',(()=>{const m=u.notifications.find(p=>p.user_id===i.user_id&&!p.is_read).length;return m>0?'<span class="nav-msg-badge" style="display:flex;">'+(m>99?"99+":m)+"</span>":""})(),"</a>",'<div class="topbar-user-pill"><img src="'+o+'" class="topbar-avatar" alt=""><span>'+K(i.display_name.split(" ")[0])+"</span></div>","</div>","</div>",'<div class="dashboard-content fade-in" id="dashboard-content"></div>',"</main>","</div>"].join("");const v=e.querySelector("#dashboard-content");switch(s){case"overview":zi(v,i);break;case"listings":ji(v,i);break;case"messages":Di(v,i);break;case"saved":Gt(v,i);break;case"searches":Fi(v,i);break;case"verification":Ze(v,i);break;case"subscription":Hi(v,i);break;case"settings":Ni(v,i);break;case"notifications":Ui(v,i);break}e.querySelector("#btn-signout").addEventListener("click",async()=>{await Ut(),X("/")});const b=e.querySelector("#dashboard-sidebar"),y=e.querySelector("#sidebar-backdrop"),g=e.querySelector("#sidebar-toggle"),f=e.querySelector("#sidebar-close");function h(){b.classList.add("mobile-open"),y.classList.add("visible")}function c(){b.classList.remove("mobile-open"),y.classList.remove("visible")}g&&g.addEventListener("click",h),f&&f.addEventListener("click",c),y&&y.addEventListener("click",c)}function Ri(e){const a=u.threads.find(i=>i.participants.includes(e)).reduce((i,s)=>i+(s["unread_count_"+e]||0),0);return a>0?'<span class="badge badge-primary badge-sm" style="margin-left:auto;">'+a+"</span>":""}function Pi(e){const t=u.notifications.find(a=>a.user_id===e&&!a.is_read).length;return t>0?'<span class="badge badge-primary badge-sm" style="margin-left:auto;">'+t+"</span>":""}function dt(e){const t=Date.now()-new Date(e).getTime(),a=Math.floor(t/6e4);if(a<1)return"Just now";if(a<60)return a+"m ago";const i=Math.floor(a/60);if(i<24)return i+"h ago";const s=Math.floor(i/24);return s<7?s+"d ago":new Date(e).toLocaleDateString([],{month:"short",day:"numeric"})}function K(e){return String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}function te(e,t="success"){const a=document.getElementById("rg-toast");a&&a.remove();const i=document.createElement("div");i.id="rg-toast",i.className="rg-toast rg-toast-"+t,i.innerHTML='<i class="fa-solid '+(t==="error"?"fa-circle-exclamation":"fa-circle-check")+'"></i> '+e,document.body.appendChild(i),setTimeout(()=>i.classList.add("visible"),10),setTimeout(()=>{i.classList.remove("visible"),setTimeout(()=>i.remove(),300)},3500)}function zi(e,t){const a=u.listings.find(f=>f.user_id===t.user_id),i=a.filter(f=>f.status==="active").length,s=a.reduce((f,h)=>f+(h.views_count||0),0),o=(t.saved_listings||[]).length,n=u.threads.find(f=>f.participants.includes(t.user_id)),l=n.reduce((f,h)=>f+(h["unread_count_"+t.user_id]||0),0),d=[];n.filter(f=>!f.is_archived).sort((f,h)=>new Date(h.last_message_at)-new Date(f.last_message_at)).slice(0,3).forEach(f=>{const h=f.participants.find(S=>S!==t.user_id),c=h?u.users.findById(h):null,m=u.listings.findById(f.listing_id),p=f["unread_count_"+t.user_id]||0,r=c?c.display_name:"Someone",w=m?m.title:"a listing";d.push({icon:"fa-envelope",color:p>0?"activity-icon-violet":"activity-icon-blue",text:"<strong>"+K(r)+"</strong> "+(p>0?"sent you a new message":"messaged you")+" about <em>"+K(w)+"</em>.",time:dt(f.last_message_at)})}),a.filter(f=>(f.views_count||0)>=50).slice(0,2).forEach(f=>{d.push({icon:"fa-eye",color:"activity-icon-green",text:"Your listing <em>"+K(f.title)+"</em> has <strong>"+(f.views_count||0)+" views</strong>.",time:dt(f.created_at)})}),o>0&&d.push({icon:"fa-heart",color:"activity-icon-rose",text:"You have <strong>"+o+" saved listing"+(o!==1?"s":"")+"</strong>. Browse them anytime.",time:"Saved"});const b=d.length===0?'<div class="activity-empty"><i class="fa-solid fa-inbox"></i><p>No activity yet. Post a listing or send a message to get started.</p></div>':d.slice(0,5).map(f=>['<div class="activity-item">','<div class="activity-icon '+f.color+'"><i class="fa-solid '+f.icon+'"></i></div>','<div class="activity-content">','<div class="activity-meta">'+f.text+"</div>",'<div class="activity-time">'+f.time+"</div>","</div>","</div>"].join("")).join(""),y=t.display_name.split(" ")[0],g=l>0?"You have <strong>"+l+" unread message"+(l!==1?"s":"")+"</strong> waiting.":i>0?"Your "+i+" listing"+(i!==1?"s are":" is")+" live and visible.":"Post your first listing to start connecting with renters.";e.innerHTML=['<div class="dashboard-header-bar">',"<h1>Overview</h1>",'<a href="/post-listing" class="btn btn-primary"><i class="fa-solid fa-plus"></i> Post Listing</a>',"</div>",'<div class="welcome-banner">','<div class="welcome-text">',"<h2>Welcome back, "+K(y)+"! 👋</h2>","<p>"+g+"</p>","</div>",'<div class="welcome-cta">','<a href="/search/rooms" class="btn btn-outline" style="background:rgba(255,255,255,0.15);border-color:rgba(255,255,255,0.4);color:white;">','<i class="fa-solid fa-magnifying-glass"></i> Browse Rooms</a>',"</div>","</div>",'<div class="stats-grid">','<div class="stat-card stat-card-blue">','<div class="stat-icon stat-icon-blue"><i class="fa-solid fa-house"></i></div>','<div class="stat-body"><div class="stat-value">'+i+'</div><div class="stat-label">Active Listings</div>','<div class="stat-trend neutral"><i class="fa-solid fa-arrow-right"></i> '+a.length+" total</div>","</div></div>",'<div class="stat-card stat-card-green">','<div class="stat-icon stat-icon-green"><i class="fa-solid fa-eye"></i></div>','<div class="stat-body"><div class="stat-value">'+s+'</div><div class="stat-label">Total Views</div>','<div class="stat-trend '+(s>0?"up":"neutral")+'"><i class="fa-solid fa-'+(s>0?"arrow-up":"minus")+'"></i> All listings</div>',"</div></div>",'<div class="stat-card stat-card-violet">','<div class="stat-icon stat-icon-violet"><i class="fa-solid fa-message"></i></div>','<div class="stat-body"><div class="stat-value">'+l+'</div><div class="stat-label">Unread Messages</div>','<div class="stat-trend '+(l>0?"up":"neutral")+'"><i class="fa-solid fa-'+(l>0?"circle-exclamation":"check")+'"></i> '+n.length+" conversations</div>","</div></div>",'<div class="stat-card stat-card-rose">','<div class="stat-icon stat-icon-rose"><i class="fa-solid fa-heart"></i></div>','<div class="stat-body"><div class="stat-value">'+o+'</div><div class="stat-label">Saved Listings</div>','<div class="stat-trend neutral"><i class="fa-solid fa-bookmark"></i> Wishlist</div>',"</div></div>","</div>",'<div class="dashboard-row" style="gap:20px;">','<div class="db-panel" style="flex:2;min-width:0;">','<h3 class="panel-title"><i class="fa-solid fa-clock-rotate-left"></i> Recent Activity</h3>','<div class="activity-feed">'+b+"</div>","</div>",'<div class="db-panel" style="flex:1;min-width:220px;">','<h3 class="panel-title"><i class="fa-solid fa-bolt"></i> Quick Actions</h3>','<div class="quick-actions-list">','<a href="/post-listing" class="qa-item"><span class="qa-item-icon qa-green"><i class="fa-solid fa-plus"></i></span>Post New Listing<i class="fa-solid fa-chevron-right qa-arrow"></i></a>','<a href="/dashboard/messages" class="qa-item"><span class="qa-item-icon qa-blue"><i class="fa-solid fa-comments"></i></span>Check Messages'+(l>0?' <span class="badge-sm" style="background:var(--primary);color:#fff;padding:1px 7px;border-radius:20px;font-size:0.68rem;font-weight:700;margin-left:4px;">'+l+"</span>":"")+'<i class="fa-solid fa-chevron-right qa-arrow"></i></a>','<a href="/dashboard/listings" class="qa-item"><span class="qa-item-icon qa-amber"><i class="fa-solid fa-list-ul"></i></span>My Listings<i class="fa-solid fa-chevron-right qa-arrow"></i></a>','<a href="/profile-setup" class="qa-item"><span class="qa-item-icon qa-violet"><i class="fa-solid fa-user-pen"></i></span>Edit Profile<i class="fa-solid fa-chevron-right qa-arrow"></i></a>','<a href="/dashboard/verification" class="qa-item"><span class="qa-item-icon" style="background:#f5f5f5;color:#333333;"><i class="fa-solid fa-shield-halved"></i></span>Verify Account<i class="fa-solid fa-chevron-right qa-arrow"></i></a>',"</div>","</div>","</div>"].join("")}function ji(e,t){const a=u.listings.find(g=>g.user_id===t.user_id).sort((g,f)=>new Date(f.created_at)-new Date(g.created_at));let i="all";function s(g){return g.length===0?'<div class="empty-state"><i class="fa-solid fa-house-circle-xmark"></i><h3>No listings here</h3><p>Post a room or apartment to find your ideal roommate.</p><a href="/post-listing" class="btn btn-primary">Post a Listing</a></div>':'<table class="db-table"><thead><tr><th>Listing</th><th>Status</th><th>Stats</th><th>Actions</th></tr></thead><tbody>'+g.map(h=>{const c=u.cities.findById(h.city),m=c?c.name:h.city||"",p=u.threads.find(_=>_.listing_id===h.listing_id&&_.participants.includes(t.user_id)).length,r=h.status==="active",w=h.photos&&h.photos[0],S=w?typeof w=="string"?w:w.thumb||w.medium||w.full||"":"",A=S?"background-image:url('"+S+"')":"";return['<tr data-lid="'+h.listing_id+'">','<td><div class="td-listing">','<div class="td-thumb" style="'+A+'">'+(!h.photos||!h.photos[0]?'<i class="fa-solid fa-house"></i>':"")+"</div>",'<div class="td-info">','<h4><a href="/listing/'+h.listing_id+'" style="color:inherit;text-decoration:none;">'+K(h.title)+"</a></h4>","<p>"+K(m)+(h.price?" &bull; $"+h.price+"/mo":"")+"</p>","</div></div></td>",'<td><span class="badge '+(r?"badge-success":h.status==="paused"?"badge-warning":"badge-gray")+'" style="font-size:0.72rem;padding:3px 10px;border-radius:20px;">'+h.status.charAt(0).toUpperCase()+h.status.slice(1)+"</span></td>",'<td><div class="td-stats"><span><i class="fa-solid fa-eye"></i> '+(h.views_count||0)+'</span><span><i class="fa-solid fa-message"></i> '+p+"</span></div></td>",'<td><div class="td-actions">','<button class="btn-icon-sm action-view" data-id="'+h.listing_id+'" title="View listing"><i class="fa-solid fa-eye"></i></button>','<button class="btn-icon-sm action-edit" data-id="'+h.listing_id+'" title="Edit listing"><i class="fa-solid fa-pen"></i></button>','<button class="btn-icon-sm '+(r?"":"success")+' action-toggle" data-id="'+h.listing_id+'" title="'+(r?"Pause":"Activate")+'"><i class="fa-solid fa-'+(r?"pause":"play")+'"></i></button>','<button class="btn-icon-sm danger action-delete" data-id="'+h.listing_id+'" title="Delete"><i class="fa-solid fa-trash"></i></button>',"</div></td>","</tr>"].join("")}).join("")+"</tbody></table>"}function o(){return i==="active"?a.filter(g=>g.status==="active"):i==="paused"?a.filter(g=>g.status==="paused"):a}function n(){e.querySelectorAll(".db-tab").forEach(h=>h.classList.toggle("active",h.dataset.filter===i));const f=e.querySelector(".listings-table-container");f&&(f.innerHTML=s(o())),l()}function l(){e.querySelectorAll(".action-view").forEach(g=>{g.addEventListener("click",()=>{X("/listing/"+g.dataset.id)})}),e.querySelectorAll(".action-toggle").forEach(g=>{g.addEventListener("click",()=>{const f=u.listings.findById(g.dataset.id);if(!f)return;const h=f.status==="active"?"paused":"active";u.listings.update(g.dataset.id,{status:h});const c=a.findIndex(m=>m.listing_id===g.dataset.id);c>-1&&(a[c]={...a[c],status:h}),te("Listing "+(h==="active"?"activated":"paused")+"."),n()})}),e.querySelectorAll(".action-delete").forEach(g=>{g.addEventListener("click",()=>{const f=u.listings.findById(g.dataset.id);if(!f||!confirm('Delete "'+f.title+'"? This cannot be undone.'))return;u.listings.delete(g.dataset.id);const h=a.findIndex(c=>c.listing_id===g.dataset.id);h>-1&&a.splice(h,1),te("Listing deleted."),n()})}),e.querySelectorAll(".action-edit").forEach(g=>{g.addEventListener("click",()=>{const f=u.listings.findById(g.dataset.id);f&&d(f)})})}function d(g){const f=e.querySelector("#edit-listing-overlay");e.querySelector("#el-title").value=g.title||"",e.querySelector("#el-price").value=g.price||"",e.querySelector("#el-deposit").value=g.deposit||"",e.querySelector("#el-room-type").value=g.room_type||"private_room",e.querySelector("#el-available").value=g.available_from||g.move_in_date||"",e.querySelector("#el-min-stay").value=g.min_stay||"flexible",e.querySelector("#el-utilities").checked=!!g.utilities_included,e.querySelector("#el-description").value=g.description||"",f.dataset.editId=g.listing_id,f.style.display="block",document.body.style.overflow="hidden"}function v(){const g=e.querySelector("#edit-listing-overlay");g.style.display="none",document.body.style.overflow=""}const b=a.filter(g=>g.status==="active").length,y=a.filter(g=>g.status==="paused").length;e.innerHTML=['<div class="dashboard-header-bar"><h1>My Listings</h1><a href="/post-listing" class="btn btn-primary"><i class="fa-solid fa-plus"></i> Post New</a></div>','<div class="dashboard-tabs">','<button class="db-tab active" data-filter="all">All ('+a.length+")</button>",'<button class="db-tab" data-filter="active">Active ('+b+")</button>",'<button class="db-tab" data-filter="paused">Paused ('+y+")</button>","</div>",'<div class="listings-table-container">'+s(a)+"</div>",'<div id="edit-listing-overlay" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:1000;overflow-y:auto;padding:24px 16px;">','<div id="edit-listing-modal" style="background:#fff;max-width:640px;margin:0 auto;border-radius:20px;overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,0.2);">','<div style="display:flex;justify-content:space-between;align-items:center;padding:20px 24px;border-bottom:1px solid #e2e8f0;">','<h3 style="margin:0;font-size:1.2rem;font-weight:700;color:#1e293b;">Edit Listing</h3>','<button id="edit-modal-close" style="background:none;border:none;font-size:1.4rem;cursor:pointer;color:#64748b;line-height:1;">&times;</button>',"</div>",'<div style="padding:24px;display:flex;flex-direction:column;gap:18px;">','<div><label style="display:block;font-weight:600;font-size:0.85rem;color:#475569;margin-bottom:6px;">Title *</label>','<input id="el-title" class="adm-input" style="width:100%;box-sizing:border-box;" placeholder="e.g. Cozy private room in downtown"></div>','<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">','<div><label style="display:block;font-weight:600;font-size:0.85rem;color:#475569;margin-bottom:6px;">Price ($/mo) *</label>','<input id="el-price" type="number" class="adm-input" style="width:100%;box-sizing:border-box;" placeholder="e.g. 1200"></div>','<div><label style="display:block;font-weight:600;font-size:0.85rem;color:#475569;margin-bottom:6px;">Deposit ($)</label>','<input id="el-deposit" type="number" class="adm-input" style="width:100%;box-sizing:border-box;" placeholder="e.g. 500"></div>',"</div>",'<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">','<div><label style="display:block;font-weight:600;font-size:0.85rem;color:#475569;margin-bottom:6px;">Room Type</label>','<select id="el-room-type" class="adm-input" style="width:100%;box-sizing:border-box;">','<option value="private_room">Private Room</option>','<option value="shared_room">Shared Room</option>','<option value="entire_apartment">Entire Apartment</option>','<option value="studio">Studio</option>',"</select></div>",'<div><label style="display:block;font-weight:600;font-size:0.85rem;color:#475569;margin-bottom:6px;">Date Available</label>','<input id="el-available" type="date" class="adm-input" style="width:100%;box-sizing:border-box;"></div>',"</div>",'<div><label style="display:block;font-weight:600;font-size:0.85rem;color:#475569;margin-bottom:6px;">Min. Stay</label>','<select id="el-min-stay" class="adm-input" style="width:100%;box-sizing:border-box;">','<option value="flexible">Flexible</option>','<option value="1_month">1 Month</option>','<option value="3_months">3 Months</option>','<option value="6_months">6 Months</option>','<option value="12_months">12 Months</option>',"</select></div>",'<div style="display:flex;justify-content:space-between;align-items:center;">','<span style="font-weight:600;font-size:0.9rem;color:#475569;">Utilities Included</span>','<label style="display:inline-flex;align-items:center;cursor:pointer;gap:8px;"><input type="checkbox" id="el-utilities" style="width:18px;height:18px;cursor:pointer;"> <span style="font-size:0.9rem;color:#1e293b;">Yes</span></label>',"</div>",'<div><label style="display:block;font-weight:600;font-size:0.85rem;color:#475569;margin-bottom:6px;">Description</label>','<textarea id="el-description" class="adm-input" rows="5" style="width:100%;box-sizing:border-box;resize:vertical;" placeholder="Describe the space, rules, and surroundings…"></textarea></div>',"</div>",'<div style="display:flex;gap:12px;padding:16px 24px;border-top:1px solid #e2e8f0;justify-content:flex-end;">','<button id="edit-modal-cancel" class="btn btn-outline">Cancel</button>','<button id="edit-modal-save" class="btn btn-primary"><i class="fa-solid fa-floppy-disk"></i> Save Changes</button>',"</div>","</div></div>"].join(""),e.querySelectorAll(".db-tab").forEach(g=>{g.addEventListener("click",()=>{i=g.dataset.filter,n()})}),l(),e.querySelector("#edit-modal-close").addEventListener("click",v),e.querySelector("#edit-modal-cancel").addEventListener("click",v),e.querySelector("#edit-listing-overlay").addEventListener("click",g=>{g.target===e.querySelector("#edit-listing-overlay")&&v()}),e.querySelector("#edit-modal-save").addEventListener("click",()=>{const f=e.querySelector("#edit-listing-overlay").dataset.editId,h=e.querySelector("#el-title").value.trim(),c=parseInt(e.querySelector("#el-price").value)||0;if(!h){te("Title is required.","error");return}if(!c){te("Price is required.","error");return}const m={title:h,price:c,deposit:parseInt(e.querySelector("#el-deposit").value)||0,room_type:e.querySelector("#el-room-type").value,available_from:e.querySelector("#el-available").value,move_in_date:e.querySelector("#el-available").value,min_stay:e.querySelector("#el-min-stay").value,utilities_included:e.querySelector("#el-utilities").checked,description:e.querySelector("#el-description").value.trim()};u.listings.update(f,m);const p=a.findIndex(r=>r.listing_id===f);p>-1&&(a[p]={...a[p],...m}),v(),te("Listing updated successfully."),n()})}function Di(e,t){const i=new URLSearchParams(window.location.search).get("threadId");let s="all",o=i||null,n="";function l(){return u.threads.find(m=>m.participants.includes(t.user_id)).filter(m=>s==="unread"?(m["unread_count_"+t.user_id]||0)>0&&!m.is_archived:s==="archived"?m.is_archived:!m.is_archived).filter(m=>{if(!n)return!0;const p=n.toLowerCase(),r=u.users.findById(m.participants.find(S=>S!==t.user_id)),w=u.listings.findById(m.listing_id);return r&&r.display_name.toLowerCase().includes(p)||w&&w.title.toLowerCase().includes(p)}).sort((m,p)=>new Date(p.last_message_at)-new Date(m.last_message_at))}function d(){const c=e.querySelector("#msg-thread-list");if(!c)return;const m=l();if(m.length===0){c.innerHTML='<div class="msg-empty-threads"><i class="fa-solid fa-inbox"></i><p>'+(n?"No matching conversations.":"No conversations yet.")+"</p></div>";return}c.innerHTML=m.map(p=>{const r=p.participants.find(E=>E!==t.user_id),w=u.users.findById(r)||{display_name:"User",profile_photo:"",verification_level:"basic"},S=u.listings.findById(p.listing_id),A=p["unread_count_"+t.user_id]||0,_=p.thread_id===o,$=w.profile_photo||"https://ui-avatars.com/api/?name="+encodeURIComponent(w.display_name)+"&background=6366f1&color=fff&size=80";return['<div class="msg-thread-card '+(_?"active":"")+" "+(A>0?"has-unread":"")+'" data-tid="'+p.thread_id+'">','<div class="msg-tc-avatar-wrap">','<a href="/profile/'+r+'" class="msg-tc-avatar-link" onclick="event.stopPropagation()"><img src="'+$+'" class="msg-tc-avatar" alt="'+K(w.display_name)+'"></a>',je(w.verification_level),"</div>",'<div class="msg-tc-body">','<div class="msg-tc-top"><a href="/profile/'+r+'" class="msg-tc-name-link" onclick="event.stopPropagation()">'+K(w.display_name)+'</a><span class="msg-tc-time">'+dt(p.last_message_at)+"</span></div>",S?'<div class="msg-tc-listing"><i class="fa-solid fa-house-chimney"></i> '+K(S.title)+"</div>":"",'<div class="msg-tc-preview '+(A>0?"font-semibold":"")+'">'+K(p.last_message_preview||"New conversation")+"</div>","</div>",A>0?'<div class="msg-unread-badge">'+A+"</div>":"","</div>"].join("")}).join(""),c.querySelectorAll(".msg-thread-card").forEach(p=>{p.addEventListener("click",()=>{o=p.dataset.tid,v(),d()})})}function v(){const c=e.querySelector("#msg-conv-panel");if(!c)return;if(!o){c.innerHTML='<div class="msg-empty-convo"><i class="fa-solid fa-comments"></i><h3>Select a conversation</h3><p>Choose a thread from the left to start chatting.</p></div>';return}const m=u.threads.findById(o);if(!m)return;const p=m.participants.find(M=>M!==t.user_id),r=u.users.findById(p)||{display_name:"User",profile_photo:"",verification_level:"basic"},w=u.listings.findById(m.listing_id),S=r.profile_photo||"https://ui-avatars.com/api/?name="+encodeURIComponent(r.display_name)+"&background=6366f1&color=fff&size=80";u.messages.find(M=>M.thread_id===o&&M.sender_id!==t.user_id&&!M.is_read).forEach(M=>{u.messages.update(M.message_id,{is_read:!0,read_at:new Date().toISOString()})}),u.threads.update(o,{["unread_count_"+t.user_id]:0});const A=u.messages.find(M=>M.thread_id===o).sort((M,R)=>new Date(M.created_at)-new Date(R.created_at)),_=A.map(M=>{const R=M.sender_id===t.user_id,F=new Date(M.created_at).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),H=R?'<span class="msg-receipt '+(M.is_read?"read":"")+'"><i class="fa-solid fa-check-double"></i></span>':"",x=M.photo_url?'<div class="msg-photo-wrap"><img src="'+M.photo_url+`" class="msg-photo-thumb" onclick="var lb=document.getElementById('msg-lb');lb.style.display='flex';document.getElementById('msg-lb-img').src='`+M.photo_url+`'"></div>`:"",O=M.content?'<div class="msg-bubble">'+K(M.content)+"</div>":"";return['<div class="msg-bubble-row '+(R?"msg-out":"msg-in")+'" data-mid="'+M.message_id+'">',R?"":'<a href="/profile/'+p+'" class="msg-bubble-avatar-link"><img src="'+S+'" class="msg-bubble-avatar"></a>','<div class="msg-bubble-group">',x,O,'<div class="msg-bubble-meta"><span class="msg-time">'+F+"</span>"+H+"</div>","</div>","</div>"].join("")}).join(""),$=['<div class="msg-chat-header">','<div class="msg-header-left">','<a href="/profile/'+p+'" class="msg-hdr-avatar-link"><img src="'+S+'" class="msg-hdr-avatar" alt="'+K(r.display_name)+'"></a>','<div class="msg-header-info">','<div class="msg-header-name"><a href="/profile/'+p+'" class="msg-hdr-name-link">'+K(r.display_name)+"</a> "+je(r.verification_level)+"</div>",w?'<a href="/listing/'+w.listing_id+'" class="msg-header-listing"><i class="fa-solid fa-house-chimney"></i> '+K(w.title)+" &middot; $"+w.price+"/mo</a>":"","</div>","</div>",'<div class="msg-header-right">','<div class="msg-three-dot-menu" style="position:relative">','<button class="btn-icon" id="msg-menu-toggle" title="More options"><i class="fa-solid fa-ellipsis-vertical"></i></button>','<div class="msg-dropdown" id="msg-dropdown" style="display:none">','<a href="/profile/'+p+'" class="msg-dd-item" id="msg-view-profile-btn"><i class="fa-solid fa-user"></i> View Profile</a>','<div class="msg-dd-item" id="msg-archive-btn"><i class="fa-solid fa-box-archive"></i> '+(m.is_archived?"Unarchive":"Archive")+"</div>",'<div class="msg-dd-divider"></div>','<div class="msg-dd-item text-danger" id="msg-delete-convo-btn"><i class="fa-solid fa-trash-can"></i> Delete Conversation</div>','<div class="msg-dd-item text-danger" id="msg-block-btn"><i class="fa-solid fa-ban"></i> Block User</div>','<div class="msg-dd-item text-danger" id="msg-report-btn"><i class="fa-solid fa-flag"></i> Report</div>',"</div>","</div>","</div>","</div>"].join(""),E=['<div class="msg-qr-bar">','<span class="qr-label"><i class="fa-solid fa-bolt"></i></span>','<div class="qr-chips">',["Is this still available?","When can I schedule a visit?","What is the lease duration?","Are utilities included?","Is it pet-friendly?"].map(M=>'<span class="qr-chip" data-text="'+K(M)+'">'+K(M)+"</span>").join(""),"</div>","</div>"].join(""),T=['<div class="msg-input-bar">','<label class="msg-attach-btn" title="Attach photo"><i class="fa-solid fa-image"></i><input type="file" id="msg-file-input" accept="image/*" style="display:none"></label>','<textarea id="msg-text-input" class="msg-textarea" placeholder="Type a message..." rows="1"></textarea>','<button class="msg-send-btn" id="msg-send-btn" title="Send"><i class="fa-solid fa-paper-plane"></i></button>',"</div>"].join(""),j=`<div class="msg-lightbox" id="msg-lb" style="display:none" onclick="if(event.target===this)this.style.display='none'"><button class="lightbox-close" onclick="document.getElementById('msg-lb').style.display='none'"><i class="fa-solid fa-xmark"></i></button><img id="msg-lb-img" src="" alt="Full size"></div>`;c.innerHTML=[$,'<div class="msg-payment-warning" id="msg-pay-warn" style="display:none">','<i class="fa-solid fa-triangle-exclamation"></i>',"<span><strong>Safety tip:</strong> Be cautious of requests to pay outside this platform.</span>",`<button onclick="this.parentElement.style.display='none'"><i class="fa-solid fa-xmark"></i></button>`,"</div>",'<div class="msg-chat-history" id="msg-history">',A.length===0?'<div class="msg-empty-thread-tip"><i class="fa-solid fa-handshake-angle"></i> Start the conversation!</div>':"",_,"</div>",E,T,j].join(""),b(),g(m,r,p)}function b(){const c=e.querySelector("#msg-history");c&&(c.scrollTop=c.scrollHeight)}function y(c,m,p){const r=e.querySelector("#msg-history");if(!r)return;const w=document.createElement("div");w.className="msg-bubble-row msg-out",p&&(w.dataset.mid=p),w.innerHTML=['<div class="msg-bubble-group">','<div class="msg-bubble">'+K(c)+"</div>",'<div class="msg-bubble-meta"><span class="msg-time">'+m+'</span><span class="msg-receipt"><i class="fa-solid fa-check-double"></i></span></div>',"</div>"].join(""),r.appendChild(w),b()}function g(c,m,p){const r=e.querySelector("#msg-conv-panel"),w=r.querySelector("#msg-text-input"),S=r.querySelector("#msg-send-btn"),A=r.querySelector("#msg-file-input"),_=r.querySelector("#msg-menu-toggle"),$=r.querySelector("#msg-dropdown");_?.addEventListener("click",T=>{T.stopPropagation(),$.style.display=$.style.display==="none"?"block":"none"}),document.addEventListener("click",()=>{$&&($.style.display="none")},{once:!0}),r.querySelector("#msg-view-profile-btn")?.addEventListener("click",()=>{$.style.display="none"}),r.querySelector("#msg-archive-btn")?.addEventListener("click",()=>{const T=u.threads.findById(o);u.threads.update(o,{is_archived:!T.is_archived}),T.is_archived||(o=null),$.style.display="none",v(),d()}),r.querySelector("#msg-delete-convo-btn")?.addEventListener("click",()=>{if(!confirm("Delete this entire conversation? This cannot be undone.")){$.style.display="none";return}u.messages.find(T=>T.thread_id===o).forEach(T=>u.messages.delete(T.message_id)),u.threads.delete(o),o=null,$.style.display="none",te("Conversation deleted."),v(),d()}),r.querySelector("#msg-block-btn")?.addEventListener("click",()=>{confirm("Block "+m.display_name+"? They cannot message you.")&&(u.threads.update(o,{blocked_by:t.user_id}),te("User blocked successfully.")),$.style.display="none"}),r.querySelector("#msg-report-btn")?.addEventListener("click",()=>{const T=prompt("Describe the reason for this report:");T&&(u.reports.create({thread_id:o,reporter_id:t.user_id,reason:T,status:"pending"}),te("Report submitted. Thank you.")),$.style.display="none"}),r.querySelectorAll(".qr-chip").forEach(T=>{T.addEventListener("click",()=>{w&&(w.value=T.dataset.text,w.focus())})}),w?.addEventListener("input",()=>{w.style.height="auto",w.style.height=Math.min(w.scrollHeight,120)+"px"}),w?.addEventListener("keydown",T=>{T.key==="Enter"&&!T.shiftKey&&(T.preventDefault(),E())}),S?.addEventListener("click",E);function E(){const T=w?.value.trim();if(!T)return;const j="rg_rl_"+t.user_id,M=Date.now();let R=JSON.parse(localStorage.getItem(j)||'{"count":0,"ws":0}');if(M-R.ws>36e5&&(R={count:0,ws:M}),R.count>=50){te("Rate limit: max 50 messages per hour.","error");return}if(R.count++,localStorage.setItem(j,JSON.stringify(R)),/venmo\.com|paypal\.com|cashapp\.com|cash\.app|zelle/i.test(T)){const O=r.querySelector("#msg-pay-warn");O&&(O.style.display="flex")}const F=u.messages.create({thread_id:o,sender_id:t.user_id,content:T,photo_url:null,is_read:!1,read_at:null}),H=u.threads.findById(o);u.threads.update(o,{last_message_at:new Date().toISOString(),last_message_preview:T.substring(0,80),["unread_count_"+p]:(H["unread_count_"+p]||0)+1});const x=new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});y(T,x,F.message_id),w.value="",w.style.height="auto",d()}A?.addEventListener("change",T=>{const j=T.target.files[0];if(!j)return;const M=new FileReader;M.onload=R=>{const F=R.target.result;u.messages.create({thread_id:o,sender_id:t.user_id,content:"",photo_url:F,is_read:!1,read_at:null}),u.threads.update(o,{last_message_at:new Date().toISOString(),last_message_preview:"📷 Photo"}),v()},M.readAsDataURL(j)})}const f=l();if(!o&&f.length>0)o=f[0].thread_id;else if(o){const c=u.threads.findById(o);c&&c.is_archived?s="archived":c&&(c["unread_count_"+t.user_id]||0)>0&&(s="unread")}const h=u.threads.find(c=>c.participants.includes(t.user_id)).reduce((c,m)=>c+(m["unread_count_"+t.user_id]||0),0);e.innerHTML=['<div class="messages-layout">','<div class="messages-sidebar">','<div class="msg-sidebar-header">','<div class="msg-sidebar-title-row"><h2>Messages</h2>'+(h>0?'<span class="badge badge-primary">'+h+"</span>":"")+"</div>",'<div class="msg-search-wrap"><i class="fa-solid fa-magnifying-glass msg-search-icon"></i><input type="text" id="msg-search" class="msg-search-input" placeholder="Search conversations..."></div>','<div class="msg-tabs">','<button class="msg-tab active" data-tab="all">All</button>','<button class="msg-tab" data-tab="unread">Unread</button>','<button class="msg-tab" data-tab="archived">Archived</button>',"</div>","</div>",'<div class="msg-thread-list" id="msg-thread-list"></div>',"</div>",'<div class="messages-main" id="msg-conv-panel"></div>',"</div>"].join(""),d(),v(),e.querySelector("#msg-search")?.addEventListener("input",c=>{n=c.target.value,d()}),e.querySelectorAll(".msg-tab").forEach(c=>{c.addEventListener("click",()=>{s=c.dataset.tab,e.querySelectorAll(".msg-tab").forEach(m=>m.classList.toggle("active",m.dataset.tab===s)),d()})}),ze&&clearInterval(ze),ze=setInterval(()=>{d();const c=document.querySelector('a[href="/dashboard/messages"] .badge-primary'),m=u.threads.find(p=>p.participants.includes(t.user_id)).reduce((p,r)=>p+(r["unread_count_"+t.user_id]||0),0);c&&(c.textContent=m>0?m:"")},1e4)}function Gt(e,t){const i=(t.saved_listings||[]).map(n=>u.listings.findById(n)).filter(Boolean),s="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&h=400&fit=crop",o=i.map(n=>{const l=u.cities.findById(n.city),d=n.photos&&n.photos[0];return['<div class="saved-card">',`<div class="saved-card-img" style="background-image:url('`+(d?typeof d=="string"?d:d.medium||d.thumb||d.full||s:s)+`')">`,'<button class="save-btn active" data-id="'+n.listing_id+'" title="Remove from saved"><i class="fa-solid fa-heart"></i></button>',"</div>",'<div class="saved-card-body">','<div class="saved-card-price">$'+n.price+'<span style="font-size:0.78rem;font-weight:500;color:var(--text-muted);">/mo</span></div>','<div class="saved-card-title">'+K(n.title)+"</div>",'<div class="saved-card-location"><i class="fa-solid fa-location-dot"></i> '+K(l?l.name:"Unknown location")+"</div>",'<div class="saved-card-actions">','<a href="/listing/'+n.listing_id+'" class="btn btn-primary btn-sm" style="flex:1;text-align:center;">View Listing</a>','<button class="btn btn-outline btn-sm save-btn" data-id="'+n.listing_id+'" title="Remove"><i class="fa-solid fa-heart" style="color:#1a1a1a;"></i></button>',"</div>","</div>","</div>"].join("")}).join("");e.innerHTML=['<div class="dashboard-header-bar"><h1>Saved Listings</h1><span style="font-size:0.9rem;color:var(--text-muted);font-weight:500;">'+i.length+" saved</span></div>",i.length===0?'<div class="empty-state"><i class="fa-regular fa-heart"></i><h3>No saved listings</h3><p>Click the heart icon on any listing to save it here.</p><a href="/search/rooms" class="btn btn-primary">Browse Listings</a></div>':'<div class="saved-grid">'+o+"</div>"].join(""),e.addEventListener("click",n=>{const l=n.target.closest(".save-btn");if(!l||!l.dataset.id)return;n.preventDefault(),n.stopPropagation();const d=l.dataset.id,v=t.saved_listings||[],b=v.indexOf(d);b>-1&&(v.splice(b,1),u.users.update(t.user_id,{saved_listings:v}),te("Removed from saved listings."),Gt(e,t))})}function Fi(e,t){const a=(t.saved_searches||[]).slice();function i(n){if(!n)return"Any Location";const l=u.cities.findById(n);if(l)return l.name;const d=u.cities.findOne(v=>v.slug===n);return d?d.name:n.replace(/^city_/,"").replace(/_/g," ").replace(/\b\w/g,v=>v.toUpperCase())}function s(n){const l=new URLSearchParams(n),d=[];l.get("type")&&d.push(l.get("type").charAt(0).toUpperCase()+l.get("type").slice(1));const v=l.get("minPrice"),b=l.get("maxPrice");(v||b)&&d.push("$"+(v||"0")+" – $"+(b||"∞")),l.get("dur")&&d.push(l.get("dur")),l.get("furn")==="yes"&&d.push("Furnished");const y=l.get("amenities");return y&&d.push(y.split(",").length+" amenities"),d.length>0?d.map(g=>'<span class="ss-chip">'+K(g)+"</span>").join(""):'<span class="ss-chip">All listings</span>'}function o(){return a.length===0?'<div class="empty-state"><i class="fa-solid fa-bell-slash"></i><h3>No saved searches</h3><p>Run a search and click "Save Search" to get email alerts for new matches.</p><a href="/search/rooms" class="btn btn-primary">Browse Listings</a></div>':a.map((n,l)=>['<div class="ss-card" data-idx="'+l+'">','<div class="ss-info">','<div class="ss-name">'+K(n.name||"Saved Search")+"</div>",'<div class="ss-location"><i class="fa-solid fa-location-dot"></i> '+K(i(n.city))+"</div>",'<div class="ss-chips">'+s(n.queryStr||"")+"</div>",'<label class="ss-notify">','<input type="checkbox" class="ss-notify-toggle" data-idx="'+l+'" '+(n.notify?"checked":"")+">","<span>Email me new matches</span>","</label>","</div>",'<div class="ss-actions">','<button class="btn btn-outline btn-sm ss-delete" data-idx="'+l+'" style="color:#1a1a1a;border-color:#dddddd;"><i class="fa-solid fa-trash"></i></button>','<a href="/search/rooms'+K(n.queryStr||"")+'" class="btn btn-primary btn-sm">Search Now</a>',"</div>","</div>"].join("")).join("")}e.innerHTML=['<div class="dashboard-header-bar"><h1>Saved Searches</h1><span style="font-size:0.9rem;color:var(--text-muted);font-weight:500;">'+a.length+" saved</span></div>",'<div id="ss-list">'+o()+"</div>"].join(""),e.addEventListener("change",n=>{const l=n.target.closest(".ss-notify-toggle");if(!l)return;const d=parseInt(l.dataset.idx);isNaN(d)||(a[d]={...a[d],notify:l.checked},u.users.update(t.user_id,{saved_searches:a}),te(l.checked?"Email alerts enabled.":"Email alerts disabled."))}),e.addEventListener("click",n=>{const l=n.target.closest(".ss-delete");if(!l)return;const d=parseInt(l.dataset.idx);isNaN(d)||confirm("Delete this saved search?")&&(a.splice(d,1),u.users.update(t.user_id,{saved_searches:a}),te("Search deleted."),e.querySelector("#ss-list").innerHTML=o())})}function Ni(e,t){const a=t.profile_photo||"https://ui-avatars.com/api/?name="+encodeURIComponent(t.display_name)+"&background=1B4F72&color=fff&size=160",i=t.notification_prefs||{messages:!0,matches:!0,price_drops:!0,digest:!1},s=t.profile_visibility||"everyone";e.innerHTML=['<div class="dashboard-header-bar">',"<h1>Settings</h1>",'<button class="btn btn-primary" id="btn-save-settings"><i class="fa-solid fa-floppy-disk"></i> Save Changes</button>',"</div>",'<div class="settings-grid">',(()=>{const h=[{id:"clean",label:"Clean",icon:"fa-broom"},{id:"social",label:"Social",icon:"fa-users"},{id:"quiet",label:"Quiet",icon:"fa-volume-xmark"},{id:"early-bird",label:"Early Bird",icon:"fa-sun"},{id:"night-owl",label:"Night Owl",icon:"fa-moon"},{id:"pet-friendly",label:"Pet-Friendly",icon:"fa-paw"},{id:"non-smoker",label:"Non-Smoker",icon:"fa-ban-smoking"},{id:"fitness",label:"Fitness Enthusiast",icon:"fa-dumbbell"},{id:"remote-worker",label:"Remote Worker",icon:"fa-laptop-house"},{id:"student",label:"Student",icon:"fa-graduation-cap"}],c=t.lifestyle_tags||[],m=["18-24","25-30","31-35","36-40","41+"].map(S=>`<option value="${S}"${t.age_range===S?" selected":""}>${S}</option>`).join(""),p=[["asap","As soon as possible"],["1-month","Within 1 month"],["1-3-months","1–3 months"],["3-6-months","3–6 months"],["flexible","Flexible"]].map(([S,A])=>`<option value="${S}"${t.moveInTimeline===S?" selected":""}>${A}</option>`).join(""),r=h.map(S=>{const A=c.includes(S.id);return`<label class="tag-pill${A?" active":""}"><input type="checkbox" value="${S.id}"${A?" checked":""}><i class="fas ${S.icon}"></i> ${S.label}</label>`}).join(""),w=u.countries.findAll().filter(S=>S.is_active).sort((S,A)=>S.name.localeCompare(A.name)).map(S=>`<option value="${S.country_id}"${t.country===S.country_id?" selected":""}>${S.flag_emoji?S.flag_emoji+" ":""}${S.name}</option>`).join("");return`
            <div class="db-panel" style="grid-column:1 / -1;">
              <h3 class="panel-title"><i class="fa-solid fa-user-circle"></i> Public Profile</h3>
              <p style="color:var(--text-secondary);font-size:0.875rem;margin:0 0 24px;">This information is shown on your public profile to potential roommates.</p>

              <div class="settings-avatar-row">
                <div style="position:relative;flex-shrink:0;">
                  <img id="settings-avatar-img" src="${a}" alt="" class="settings-avatar">
                </div>
                <div style="flex:1;">
                  <div class="settings-avatar-name">${K(t.display_name)}</div>
                  <div class="settings-avatar-email">${K(t.email||"")}</div>
                  <label class="btn btn-outline btn-sm" for="settings-photo-input" style="cursor:pointer;display:inline-flex;align-items:center;gap:6px;"><i class="fa-solid fa-camera"></i> Change Photo<input type="file" id="settings-photo-input" accept="image/*" style="display:none;"></label>
                </div>
              </div>

              <div class="form-row-2col">
                <div class="form-group">
                  <label>Display Name</label>
                  <input type="text" class="form-control" id="settings-name" value="${K(t.display_name)}" placeholder="Your display name">
                </div>
                <div class="form-group">
                  <label>Email Address</label>
                  <input type="email" class="form-control" value="${K(t.email||"")}" disabled>
                  <div class="form-control-hint">Contact support to change your email address.</div>
                </div>
              </div>

              <div class="form-group">
                <label>Bio</label>
                <textarea class="form-control" id="settings-bio" rows="4" placeholder="Tell potential roommates a bit about yourself...">${K(t.bio||"")}</textarea>
              </div>

              <div class="form-row-2col">
                <div class="form-group">
                  <label>Country</label>
                  <div class="input-wrapper">
                    <i class="fas fa-globe"></i>
                    <select class="form-control" id="settings-country">
                      <option value="">Select your country</option>
                      ${w}
                    </select>
                  </div>
                </div>
                <div class="form-group">
                  <label>City</label>
                  <div class="input-wrapper">
                    <i class="fas fa-location-dot"></i>
                    <select class="form-control" id="settings-city" ${t.country?"":"disabled"}>
                      <option value="">Select a country first</option>
                    </select>
                  </div>
                </div>
              </div>

              <div class="form-row-2col">
                <div class="form-group">
                  <label>Age Range</label>
                  <div class="input-wrapper">
                    <i class="fas fa-cake-candles"></i>
                    <select class="form-control" id="settings-age-range">
                      <option value="">Select age range</option>
                      ${m}
                    </select>
                  </div>
                </div>
                <div class="form-group">
                  <label>Occupation</label>
                  <div class="input-wrapper">
                    <i class="fas fa-briefcase"></i>
                    <input type="text" class="form-control" id="settings-occupation" placeholder="e.g. Software Engineer" value="${K(t.occupation||"")}">
                  </div>
                </div>
              </div>

              <div class="form-group">
                <label>Lifestyle &amp; Preferences</label>
                <p style="font-size:0.8rem;color:var(--text-secondary);margin:2px 0 10px;">Select all that apply</p>
                <div class="lifestyle-tags" id="settings-lifestyle-tags">${r}</div>
              </div>

              <div class="form-group">
                <label>Monthly Budget</label>
                <div class="budget-display">
                  <span id="settings-bmin-disp">$${(t.budgetMin||500).toLocaleString()}</span>
                  <span class="budget-separator">—</span>
                  <span id="settings-bmax-disp">$${(t.budgetMax||2500).toLocaleString()}</span>
                </div>
                <div class="range-slider-container">
                  <input type="range" id="settings-bmin" class="range-slider" min="0" max="5000" step="100" value="${t.budgetMin||500}">
                  <input type="range" id="settings-bmax" class="range-slider" min="0" max="5000" step="100" value="${t.budgetMax||2500}">
                  <div class="range-track"><div class="range-fill" id="settings-range-fill"></div></div>
                </div>
                <div class="range-labels"><span>$0</span><span>$5,000</span></div>
              </div>

              <div class="form-group">
                <label>Move-in Timeline</label>
                <div class="input-wrapper">
                  <i class="fas fa-calendar-days"></i>
                  <select class="form-control" id="settings-timeline">
                    <option value="">When are you looking to move?</option>
                    ${p}
                  </select>
                </div>
              </div>
            </div>`})(),'<div class="db-panel">','<h3 class="panel-title"><i class="fa-solid fa-bell"></i> Notifications</h3>','<div class="toggle-row"><div><div class="toggle-row-label">New Messages</div><div class="toggle-row-sub">When someone messages you</div></div><label class="toggle-switch"><input type="checkbox" id="notif-messages"'+(i.messages!==!1?" checked":"")+'><span class="slider"></span></label></div>','<div class="toggle-row"><div><div class="toggle-row-label">Listing Matches</div><div class="toggle-row-sub">New matches for saved searches</div></div><label class="toggle-switch"><input type="checkbox" id="notif-matches"'+(i.matches!==!1?" checked":"")+'><span class="slider"></span></label></div>','<div class="toggle-row"><div><div class="toggle-row-label">Price Drops</div><div class="toggle-row-sub">On your saved listings</div></div><label class="toggle-switch"><input type="checkbox" id="notif-price"'+(i.price_drops!==!1?" checked":"")+'><span class="slider"></span></label></div>','<div class="toggle-row"><div><div class="toggle-row-label">Weekly Digest</div><div class="toggle-row-sub">Summary of activity &amp; new listings</div></div><label class="toggle-switch"><input type="checkbox" id="notif-digest"'+(i.digest?" checked":"")+'><span class="slider"></span></label></div>','<h3 class="panel-title" style="margin-top:22px;"><i class="fa-solid fa-eye"></i> Privacy</h3>','<div class="form-group"><label>Profile Visibility</label>','<select class="form-control" id="settings-visibility">','<option value="everyone"'+(s==="everyone"?" selected":"")+">Everyone</option>",'<option value="verified"'+(s==="verified"?" selected":"")+">Verified Members Only</option>",'<option value="hidden"'+(s==="hidden"?" selected":"")+">Hide My Profile</option>","</select></div>","</div>",'<div class="db-panel danger-zone-panel" style="grid-column:1 / -1;">','<h3 class="panel-title"><i class="fa-solid fa-triangle-exclamation"></i> Danger Zone</h3>','<p style="color:var(--text-secondary);margin-bottom:16px;font-size:0.9rem;">Permanently delete your account and all associated data. This cannot be undone.</p>','<button class="btn btn-sm" id="btn-delete-account" style="border:1px solid #1a1a1a;color:#1a1a1a;background:white;"><i class="fa-solid fa-trash"></i> Delete My Account</button>',"</div>","</div>"].join(""),e.querySelector("#btn-save-settings").addEventListener("click",()=>{const h=e.querySelector("#btn-save-settings"),c=e.querySelector("#settings-name").value.trim(),m=e.querySelector("#settings-bio").value.trim();if(!c){te("Display name cannot be empty.","error");return}const p=Array.from(e.querySelectorAll("#settings-lifestyle-tags .tag-pill input:checked")).map(S=>S.value),r={display_name:c,bio:m,profile_visibility:e.querySelector("#settings-visibility").value,notification_prefs:{messages:e.querySelector("#notif-messages").checked,matches:e.querySelector("#notif-matches").checked,price_drops:e.querySelector("#notif-price").checked,digest:e.querySelector("#notif-digest").checked},country:e.querySelector("#settings-country").value,city:e.querySelector("#settings-city").value,age_range:e.querySelector("#settings-age-range").value,occupation:e.querySelector("#settings-occupation").value.trim(),lifestyle_tags:p,budgetMin:parseInt(e.querySelector("#settings-bmin").value)||0,budgetMax:parseInt(e.querySelector("#settings-bmax").value)||5e3,moveInTimeline:e.querySelector("#settings-timeline").value,profileComplete:!0},w=e.querySelector("#settings-avatar-img");w.dataset.newSrc&&(r.profile_photo=w.dataset.newSrc),u.users.update(t.user_id,r),Object.assign(t,r),h.innerHTML='<i class="fa-solid fa-check"></i> Saved!',h.style.background="#333333",setTimeout(()=>{h.innerHTML='<i class="fa-solid fa-floppy-disk"></i> Save Changes',h.style.background=""},2400),te("Settings saved successfully.")});const o=e.querySelector("#settings-bmin"),n=e.querySelector("#settings-bmax"),l=e.querySelector("#settings-bmin-disp"),d=e.querySelector("#settings-bmax-disp"),v=e.querySelector("#settings-range-fill");function b(){let h=parseInt(o.value),c=parseInt(n.value);h>c&&(o.value=c,n.value=h,[h,c]=[c,h]),l.textContent="$"+h.toLocaleString(),d.textContent="$"+c.toLocaleString(),v.style.left=h/5e3*100+"%",v.style.width=(c-h)/5e3*100+"%"}o.addEventListener("input",b),n.addEventListener("input",b),b();const y=e.querySelector("#settings-country"),g=e.querySelector("#settings-city");function f(h,c=""){g.innerHTML='<option value="">Loading cities...</option>',g.disabled=!0;const m=u.cities.find(p=>p.country===h&&p.is_active!==!1).sort((p,r)=>p.name.localeCompare(r.name));m.length===0?g.innerHTML='<option value="">No cities available</option>':(g.innerHTML='<option value="">Select your city</option>',m.forEach(p=>{const r=document.createElement("option");r.value=p.city_id,r.textContent=p.name,p.city_id===c&&(r.selected=!0),g.appendChild(r)}),g.disabled=!1)}t.country&&f(t.country,t.city||""),y.addEventListener("change",()=>{const h=y.value;h?f(h):(g.innerHTML='<option value="">Select a country first</option>',g.disabled=!0)}),e.querySelectorAll("#settings-lifestyle-tags .tag-pill").forEach(h=>{h.querySelector("input").addEventListener("change",c=>{h.classList.toggle("active",c.target.checked)})}),e.querySelector("#settings-photo-input").addEventListener("change",h=>{const c=h.target.files[0];if(!c)return;const m=new FileReader;m.onload=p=>{const r=e.querySelector("#settings-avatar-img");r.src=p.target.result,u.users.update(t.user_id,{profile_photo:p.target.result}),te("Profile photo updated!","success")},m.readAsDataURL(c)}),e.querySelector("#btn-delete-account").addEventListener("click",()=>{confirm("Are you absolutely sure? This will permanently delete your account.")&&confirm("Last warning — this is irreversible. Continue?")&&(u.listings.find(h=>h.user_id===t.user_id).forEach(h=>u.listings.delete(h.listing_id)),u.users.delete(t.user_id),localStorage.removeItem("rg_current_user"),te("Account deleted. Redirecting…"),setTimeout(()=>{X("/")},1500))})}function Ui(e,t){function a(){return u.notifications.find(s=>s.user_id===t.user_id).sort((s,o)=>new Date(o.created_at)-new Date(s.created_at))}function i(){const s=a(),o=s.filter(l=>!l.is_read).length,n=s.length===0?'<div style="text-align:center;padding:60px 20px;color:var(--text-secondary);"><i class="fa-solid fa-bell-slash" style="font-size:2.5rem;margin-bottom:16px;display:block;opacity:0.4;"></i><p style="font-size:0.95rem;">No notifications yet</p></div>':s.map(l=>{const d=new Date(l.created_at).toLocaleString([],{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"});return`
                <div class="notif-card${l.is_read?"":" notif-card-unread"}" data-nid="${l.notification_id}" style="display:flex;gap:14px;align-items:flex-start;padding:16px;border-radius:12px;border:1px solid var(--border);background:${l.is_read?"var(--surface)":"#f0f4ff"};margin-bottom:10px;cursor:pointer;transition:box-shadow 0.15s;">
                  ${l.image_url?`<img src="${l.image_url}" style="width:64px;height:64px;border-radius:8px;object-fit:cover;flex-shrink:0;">`:'<div style="width:42px;height:42px;border-radius:10px;background:var(--primary);display:flex;align-items:center;justify-content:center;flex-shrink:0;"><i class="fa-solid fa-bell" style="color:#fff;font-size:1rem;"></i></div>'}
                  <div style="flex:1;min-width:0;">
                    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                      <span style="font-weight:700;font-size:0.9rem;">${K(l.title)}</span>
                      ${l.is_read?"":'<span style="width:8px;height:8px;border-radius:50%;background:var(--primary);display:inline-block;flex-shrink:0;"></span>'}
                    </div>
                    <p style="margin:4px 0 6px;font-size:0.85rem;color:var(--text-secondary);line-height:1.5;">${K(l.description)}</p>
                    <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
                      <span style="font-size:0.75rem;color:var(--text-secondary);">${d}</span>
                      ${l.website_url?`<a href="${K(l.website_url)}" target="_blank" rel="noopener" style="font-size:0.78rem;color:var(--primary);font-weight:600;display:inline-flex;align-items:center;gap:4px;" onclick="event.stopPropagation()"><i class="fa-solid fa-arrow-up-right-from-square" style="font-size:0.65rem;"></i> Learn more</a>`:""}
                    </div>
                  </div>
                  <button class="notif-delete-btn" data-nid="${l.notification_id}" title="Delete" style="background:none;border:none;cursor:pointer;color:var(--text-secondary);padding:4px;flex-shrink:0;" onclick="event.stopPropagation()"><i class="fa-solid fa-xmark"></i></button>
                </div>`}).join("");e.innerHTML=`
            <div class="dashboard-header-bar">
                <h1>Notifications</h1>
                ${o>0?'<button class="btn btn-outline btn-sm" id="notif-mark-all-read"><i class="fa-solid fa-check-double"></i> Mark all as read</button>':""}
            </div>
            <div style="max-width:680px;">${n}</div>`,e.querySelector("#notif-mark-all-read")?.addEventListener("click",()=>{a().filter(l=>!l.is_read).forEach(l=>u.notifications.update(l.notification_id,{is_read:!0})),i()}),e.querySelectorAll(".notif-card").forEach(l=>{l.addEventListener("click",()=>{const d=l.dataset.nid;u.notifications.update(d,{is_read:!0});const v=u.notifications.findById(d);v?.website_url?window.open(v.website_url,"_blank","noopener"):i()})}),e.querySelectorAll(".notif-delete-btn").forEach(l=>{l.addEventListener("click",()=>{u.notifications.delete(l.dataset.nid),i()})})}i()}function Hi(e,t){const a=t.subscription_tier||"free",i={free:{name:"Free",price:"$0",period:"forever",color:"#64748b",icon:"fa-seedling",features:["1 active listing","5 messages per month","Basic search & filters","1 saved search","Basic listing analytics (views only)"]},basic:{name:"Basic",price:"$4.99",period:"/month",color:"#1a1a1a",icon:"fa-bolt",features:["3 active listings","Unlimited messages","Advanced search & filters","3 saved searches with alerts","See who viewed your listing","Views + clicks analytics"]},premium:{name:"Premium",price:"$9.99",period:"/month",color:"#1a1a1a",icon:"fa-star",features:["10 active listings","Unlimited messages","2 featured listing credits/month","Urgent badge on listings","10 saved searches with alerts","Full analytics dashboard","Priority support"]},pro:{name:"Pro",price:"$19.99",period:"/month",color:"#555555",icon:"fa-building",features:["Unlimited listings","Unlimited messages","5 featured listing credits/month","Urgent badge + promoted profile","Unlimited saved searches","Full analytics + data export","24-hour early access to new listings","Priority support"]}},s=i[a]||i.free,o=a!=="free",n=new Date(Date.now()+720*60*60*1e3).toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"});e.innerHTML=`
        <div class="dashboard-header-bar">
            <h1>Subscription</h1>
            ${o?`<button class="btn btn-outline" onclick="navigate('/contact')"><i class="fas fa-arrow-up-right-from-square"></i> Change Plan</button>`:`<button class="btn btn-primary" onclick="navigate('/contact')"><i class="fas fa-star"></i> Upgrade Plan</button>`}
        </div>

        <!-- Current Plan Card -->
        <div class="sub-current-card" style="border-left: 4px solid ${s.color};">
            <div class="sub-plan-left">
                <div class="sub-plan-icon" style="background:${s.color}15; color:${s.color};">
                    <i class="fas ${s.icon}"></i>
                </div>
                <div>
                    <div class="sub-plan-label">Current Plan</div>
                    <div class="sub-plan-name">${s.name}
                        <span class="sub-current-badge"><i class="fas fa-circle-check"></i> Active</span>
                    </div>
                    <div class="sub-plan-price">${s.price}<span class="sub-plan-period">${s.period}</span></div>
                </div>
            </div>
            ${o?`
            <div class="sub-plan-right">
                <div class="sub-billing-info">
                    <div class="sub-billing-label">Next billing date</div>
                    <div class="sub-billing-date">${n}</div>
                </div>
                <button class="btn-text-danger" onclick="if(confirm('Cancel your ${s.name} subscription?')) alert('Cancellation requested. You keep access until ${n}.')">
                    <i class="fas fa-xmark"></i> Cancel Subscription
                </button>
            </div>`:`
            <div class="sub-plan-right">
                <p style="color:var(--text-secondary);font-size:0.9rem;max-width:260px;">Upgrade to unlock more listings, unlimited messages, and powerful analytics.</p>
            </div>`}
        </div>

        <!-- Features in Current Plan -->
        <div class="db-panel" style="margin-top:24px;">
            <h3 class="panel-title">What's included in ${s.name}</h3>
            <ul class="sub-feature-list">
                ${s.features.map(l=>`
                <li class="sub-feature-item">
                    <i class="fas fa-check sub-check" style="color:${s.color}"></i>
                    <span>${l}</span>
                </li>`).join("")}
            </ul>
        </div>

        <!-- Upgrade Banner (only for non-Pro) -->
        ${a!=="pro"?`
        <div class="sub-upgrade-banner">
            <div class="sub-upgrade-text">
                <h3>${a==="free"?"Ready to get more?":"Want even more power?"}</h3>
                <p>${a==="free"?"Upgrade to Basic, Premium, or Pro to unlock unlimited messages, advanced filters, and more.":"Upgrade to the next tier to unlock more featured credits, analytics, and priority support."}
                </p>
            </div>
            <button class="btn btn-primary sub-upgrade-btn" onclick="navigate('/contact')">
                Contact Us to Upgrade <i class="fas fa-arrow-right"></i>
            </button>
        </div>`:""}

        <style>
            .sub-current-card {
                background: white;
                border-radius: 16px;
                border: 1px solid var(--border);
                padding: 28px 32px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 24px;
                flex-wrap: wrap;
                box-shadow: var(--shadow-sm);
                margin-top: 8px;
            }
            .sub-plan-left { display: flex; align-items: center; gap: 20px; }
            .sub-plan-icon {
                width: 56px; height: 56px;
                border-radius: 14px;
                display: flex; align-items: center; justify-content: center;
                font-size: 1.4rem; flex-shrink: 0;
            }
            .sub-plan-label { font-size: 0.78rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px; color: var(--text-secondary); margin-bottom: 4px; }
            .sub-plan-name { font-size: 1.4rem; font-weight: 800; color: var(--text-primary); display: flex; align-items: center; gap: 10px; }
            .sub-current-badge { font-size: 0.72rem; background: #f5f5f5; color: #333333; border: 1px solid #dddddd; padding: 3px 10px; border-radius: 20px; font-weight: 700; }
            .sub-plan-price { font-size: 1.6rem; font-weight: 900; color: var(--text-primary); margin-top: 6px; }
            .sub-plan-period { font-size: 0.85rem; font-weight: 400; color: var(--text-secondary); margin-left: 3px; }
            .sub-plan-right { display: flex; flex-direction: column; align-items: flex-end; gap: 12px; }
            .sub-billing-label { font-size: 0.78rem; color: var(--text-secondary); text-align: right; }
            .sub-billing-date { font-size: 0.95rem; font-weight: 600; color: var(--text-primary); }
            .btn-text-danger { background: none; border: none; color: #1a1a1a; font-size: 0.85rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; padding: 0; }
            .btn-text-danger:hover { text-decoration: underline; }
            .sub-feature-list { list-style: none; padding: 0; margin: 16px 0 0; columns: 2; column-gap: 32px; }
            @media (max-width: 600px) { .sub-feature-list { columns: 1; } }
            .sub-feature-item { display: flex; align-items: flex-start; gap: 10px; padding: 6px 0; font-size: 0.9rem; color: var(--text-secondary); break-inside: avoid; }
            .sub-check { flex-shrink: 0; margin-top: 2px; }
            .sub-upgrade-banner {
                background: linear-gradient(135deg, #1a1a1a 0%, #333333 100%);
                border-radius: 16px;
                padding: 28px 32px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 24px;
                flex-wrap: wrap;
                margin-top: 24px;
                color: white;
            }
            .sub-upgrade-text h3 { font-size: 1.15rem; font-weight: 800; margin-bottom: 6px; }
            .sub-upgrade-text p  { font-size: 0.875rem; opacity: 0.8; max-width: 480px; line-height: 1.5; margin: 0; }
            .sub-upgrade-btn {
                background: white;
                color: #1a1a1a;
                border: none;
                padding: 13px 26px;
                border-radius: 10px;
                font-weight: 700;
                white-space: nowrap;
                flex-shrink: 0;
                cursor: pointer;
                font-size: 0.95rem;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .sub-upgrade-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.2); }
        </style>
    `}function Ze(e,t){const i=t.phone_verified||t.verification_level==="phone"||t.verification_level==="id"||t.verification_level==="community",s=t.id_verified||t.id_status==="approved"||t.verification_level==="id"||t.verification_level==="community",o=t.id_status==="pending",n=t.id_status==="rejected",l=t.community_verified||t.verification_level==="community",d=Math.min(t.positive_reviews||0,5);let v=1;v=2,i&&(v=3),(s||o)&&(v=4),l&&(v=5);const b=Math.min((v-1)/3*100,100),y=[{code:"+1",flag:"🇺🇸",label:"US"},{code:"+1",flag:"🇨🇦",label:"CA"},{code:"+44",flag:"🇬🇧",label:"UK"},{code:"+91",flag:"🇮🇳",label:"IN"},{code:"+61",flag:"🇦🇺",label:"AU"},{code:"+49",flag:"🇩🇪",label:"DE"},{code:"+33",flag:"🇫🇷",label:"FR"},{code:"+34",flag:"🇪🇸",label:"ES"},{code:"+39",flag:"🇮🇹",label:"IT"},{code:"+7",flag:"🇷🇺",label:"RU"},{code:"+55",flag:"🇧🇷",label:"BR"},{code:"+52",flag:"🇲🇽",label:"MX"},{code:"+81",flag:"🇯🇵",label:"JP"},{code:"+82",flag:"🇰🇷",label:"KR"},{code:"+86",flag:"🇨🇳",label:"CN"},{code:"+971",flag:"🇦🇪",label:"AE"},{code:"+65",flag:"🇸🇬",label:"SG"},{code:"+60",flag:"🇲🇾",label:"MY"},{code:"+31",flag:"🇳🇱",label:"NL"},{code:"+46",flag:"🇸🇪",label:"SE"}],g=[{label:"Email",icon:"fa-envelope",color:"#333333"},{label:"Phone",icon:"fa-phone",color:"#1a1a1a"},{label:"ID",icon:"fa-shield-halved",color:"#1a1a1a"},{label:"Community",icon:"fa-star",color:"#555555"}],f=()=>`
        <div class="verif-progress-container mb-xl text-center">
            <div class="verif-progress-track">
                <div class="verif-track-line">
                    <div class="verif-track-fill" style="width:${b}%"></div>
                </div>
                ${g.map((r,w)=>{const S=v>w+1,A=v===w+1;return`
                    <div class="verif-step ${S?"completed":A?"active":""}">
                        <div class="verif-step-bubble" style="${S?`background:${r.color};`:A?"background:var(--primary);box-shadow:0 0 0 6px rgba(27,79,114,0.15);":""}">
                            ${S?'<i class="fas fa-check"></i>':`<i class="fas ${r.icon}"></i>`}
                        </div>
                        <div class="verif-step-label" style="${S?`color:${r.color};`:A?"color:var(--text-primary);font-weight:700;":""}">${r.label}</div>
                    </div>`}).join("")}
            </div>
        </div>`,h=(r,w)=>`db-panel verif-panel ${r?"verif-completed":v===w?"expanded active-panel":""}`,c=36,m=2*Math.PI*c,p=m-d/5*m;e.innerHTML=`
        <div class="dashboard-header-bar">
            <h1>Trust &amp; Verification</h1>
        </div>
        <p class="text-muted mb-lg">Build trust in the RoommateGroups community by completing your verification levels.</p>

        ${f()}

        <div class="verification-accordion">

            <!-- Level 1: Email -->
            <div class="${h(!0,1)}">
                <div class="verif-header" onclick="this.parentElement.classList.toggle('expanded')">
                    <div class="verif-title">
                        <span class="verif-icon-wrap" style="background:#f5f5f5;"><i class="fa-solid fa-envelope" style="color:#333333;"></i></span>
                        <div>
                            <h3>Level 1 — Email Verified</h3>
                            <p>Verify your email address</p>
                        </div>
                    </div>
                    <div class="verif-status">
                        <span class="badge badge-success"><i class="fas fa-check"></i> Completed</span>
                        <i class="fa-solid fa-chevron-down verif-chevron"></i>
                    </div>
                </div>
                <div class="verif-body">
                    <div class="verif-success-msg">
                        <i class="fa-solid fa-circle-check"></i>
                        Your email address has been successfully verified.
                    </div>
                </div>
            </div>

            <!-- Level 2: Phone -->
            <div class="${h(i,2)}">
                <div class="verif-header" onclick="this.parentElement.classList.toggle('expanded')">
                    <div class="verif-title">
                        <span class="verif-icon-wrap" style="background:#f0f0f0;"><i class="fa-solid fa-phone" style="color:#1a1a1a;"></i></span>
                        <div>
                            <h3>Level 2 — Phone Verified</h3>
                            <p>Secure your account with SMS verification</p>
                        </div>
                    </div>
                    <div class="verif-status">
                        ${i?'<span class="badge badge-success"><i class="fas fa-check"></i> Completed</span>':v===2?'<span class="badge badge-primary">Current Level</span>':'<span class="badge badge-gray">Locked</span>'}
                        <i class="fa-solid fa-chevron-down verif-chevron"></i>
                    </div>
                </div>
                <div class="verif-body">
                    ${i?'<div class="verif-success-msg"><i class="fa-solid fa-circle-check"></i> Your phone number is verified.</div>':`<div class="verif-perk mb-md"><i class="fa-solid fa-arrow-trend-up"></i> Your listings will appear higher in search results.</div>
                        <div class="form-group" style="max-width:340px;">
                            <label style="font-weight:600;margin-bottom:6px;display:block;">Phone Number</label>
                            <div style="display:flex;gap:8px;align-items:center;">
                                <select class="form-input" id="phone-country" style="width:120px;padding:10px 8px;">
                                    ${y.map(r=>`<option value="${r.code}">${r.flag} ${r.label} ${r.code}</option>`).join("")}
                                </select>
                                <input type="tel" id="phone-number" class="form-input" placeholder="(555) 000-0000" style="flex:1;">
                            </div>
                        </div>
                        <button class="btn btn-primary" id="btn-send-sms">Send Verification Code</button>

                        <div id="sms-otp-block" style="display:none;margin-top:20px;">
                            <label style="font-weight:600;margin-bottom:10px;display:block;">Enter 6-digit code</label>
                            <div class="otp-boxes">
                                ${[0,1,2,3,4,5].map(r=>`<input class="otp-box" id="otp-${r}" type="text" maxlength="1" inputmode="numeric" autocomplete="off">`).join("")}
                            </div>
                            <div style="display:flex;align-items:center;gap:16px;margin-top:14px;">
                                <button class="btn btn-success" id="btn-verify-sms">Verify Code</button>
                                <span class="text-muted" style="font-size:0.85rem;">Resend in <span id="sms-timer" style="font-weight:700;color:var(--primary);">60</span>s</span>
                                <button class="btn btn-outline" id="btn-resend-sms" style="display:none;font-size:0.85rem;padding:6px 12px;">Resend Code</button>
                            </div>
                        </div>`}
                </div>
            </div>

            <!-- Level 3: ID Verification -->
            <div class="${h(s,3)}">
                <div class="verif-header" onclick="this.parentElement.classList.toggle('expanded')">
                    <div class="verif-title">
                        <span class="verif-icon-wrap" style="background:#f5f5f5;"><i class="fa-solid fa-shield-halved" style="color:#1a1a1a;"></i></span>
                        <div>
                            <h3>Level 3 — ID Verified</h3>
                            <p>Government ID &amp; live selfie match</p>
                        </div>
                    </div>
                    <div class="verif-status">
                        ${s?'<span class="badge badge-success"><i class="fas fa-check"></i> Completed</span>':o?'<span class="badge badge-warning"><i class="fas fa-clock"></i> Pending Review</span>':n?'<span class="badge badge-danger"><i class="fas fa-times"></i> Rejected</span>':v===3?'<span class="badge badge-primary">Current Level</span>':'<span class="badge badge-gray">Locked</span>'}
                        <i class="fa-solid fa-chevron-down verif-chevron"></i>
                    </div>
                </div>
                <div class="verif-body">
                    ${s?'<div class="verif-success-msg"><i class="fa-solid fa-circle-check"></i> Your government ID was verified successfully.</div>':o?`<div class="verif-alert verif-alert-warning">
                                <i class="fa-solid fa-clock"></i>
                                <div><strong>Under Review</strong><br>Your ID is being reviewed by our team. Processing usually takes within 24 hours.</div>
                               </div>`:n?`<div class="verif-alert verif-alert-danger">
                                    <i class="fa-solid fa-circle-exclamation"></i>
                                    <div><strong>Verification Rejected</strong><br>Reason: ${t.id_rejection_reason||"Please resubmit clear photos of your ID and selfie."}</div>
                                   </div>
                                   <button class="btn btn-primary mt-md" id="btn-retry-id">Retry Verification</button>`:`<div class="verif-perk mb-lg"><i class="fa-solid fa-envelope-open-text"></i> Highest trust level — get 3× more messages!</div>

                                <div class="id-verif-steps">
                                    <!-- Step A: ID Upload -->
                                    <div class="id-step-card">
                                        <div class="id-step-number">A</div>
                                        <h4>Upload Government ID</h4>
                                        <p class="text-muted" style="font-size:0.85rem;margin-bottom:12px;">Passport, Driver's License, or National ID card</p>
                                        <label class="id-upload-box" id="id-drop-zone">
                                            <i class="fa-solid fa-id-card" style="font-size:2.5rem;color:#94a3b8;margin-bottom:12px;display:block;"></i>
                                            <p style="font-weight:600;margin:0 0 4px;">Click to upload or drag &amp; drop</p>
                                            <p style="font-size:0.8rem;color:#94a3b8;margin:0;">JPG, PNG — max 10MB</p>
                                            <input type="file" accept="image/*" id="id-photo-input" style="position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%;">
                                        </label>
                                        <div id="id-photo-preview" style="display:none;margin-top:12px;text-align:center;position:relative;">
                                            <img src="" alt="ID Preview" style="max-width:100%;max-height:160px;border-radius:10px;object-fit:cover;border:2px solid #333333;">
                                            <span class="id-preview-check"><i class="fas fa-check"></i></span>
                                        </div>
                                    </div>

                                    <!-- Step B: Live Selfie -->
                                    <div class="id-step-card">
                                        <div class="id-step-number">B</div>
                                        <h4>Live Selfie Capture</h4>
                                        <p class="text-muted" style="font-size:0.85rem;margin-bottom:12px;">Must be taken live — must match your ID photo</p>

                                        <div id="selfie-idle">
                                            <div class="id-upload-box" id="btn-selfie-cam" style="cursor:pointer;">
                                                <i class="fa-solid fa-camera" style="font-size:2.5rem;color:#94a3b8;margin-bottom:12px;display:block;"></i>
                                                <p style="font-weight:600;margin:0 0 4px;">Open Camera</p>
                                                <p style="font-size:0.8rem;color:#94a3b8;margin:0;">Requires camera permission</p>
                                            </div>
                                        </div>

                                        <div id="selfie-camera-wrap" style="display:none;text-align:center;">
                                            <div style="position:relative;display:inline-block;border-radius:12px;overflow:hidden;border:2px solid var(--primary);">
                                                <video id="selfie-video" autoplay playsinline muted style="width:260px;height:195px;object-fit:cover;display:block;background:#0f172a;"></video>
                                                <div class="camera-overlay-ring"></div>
                                            </div>
                                            <div style="margin-top:12px;display:flex;gap:10px;justify-content:center;">
                                                <button class="btn btn-primary" id="btn-capture-selfie"><i class="fas fa-camera"></i> Capture</button>
                                                <button class="btn btn-outline" id="btn-cancel-camera"><i class="fas fa-times"></i> Cancel</button>
                                            </div>
                                        </div>

                                        <div id="selfie-preview" style="display:none;margin-top:12px;text-align:center;position:relative;">
                                            <img src="" id="selfie-img" alt="Selfie" style="max-width:100%;max-height:160px;border-radius:10px;object-fit:cover;border:2px solid #333333;">
                                            <span class="id-preview-check"><i class="fas fa-check"></i></span>
                                            <div style="margin-top:8px;">
                                                <button class="btn btn-outline btn-sm" id="btn-retake-selfie"><i class="fas fa-redo"></i> Retake</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <button class="btn btn-primary mt-lg btn-lg" id="btn-submit-id" disabled style="width:100%;">
                                    <i class="fas fa-shield-halved"></i> Submit for Verification
                                </button>
                                <p class="text-muted mt-sm" style="text-align:center;font-size:0.8rem;">🔒 Your documents are encrypted and securely stored</p>`}
                </div>
            </div>

            <!-- Level 4: Community -->
            <div class="${h(l,4)}">
                <div class="verif-header" onclick="this.parentElement.classList.toggle('expanded')">
                    <div class="verif-title">
                        <span class="verif-icon-wrap" style="background:#f5f5f5;"><i class="fa-solid fa-star" style="color:#555555;"></i></span>
                        <div>
                            <h3>Level 4 — Community Verified</h3>
                            <p>Earned from positive reviews by verified users</p>
                        </div>
                    </div>
                    <div class="verif-status">
                        ${l?'<span class="badge badge-success"><i class="fas fa-check"></i> Completed</span>':v===4?'<span class="badge badge-primary">In Progress</span>':'<span class="badge badge-gray">Locked</span>'}
                        <i class="fa-solid fa-chevron-down verif-chevron"></i>
                    </div>
                </div>
                <div class="verif-body">
                    ${l?'<div class="verif-success-msg"><i class="fa-solid fa-circle-check"></i> You are a pillar of the RoommateGroups community!</div>':`<p class="mb-lg" style="color:var(--text-secondary);">This level is earned, not applied for. Collect 5 positive reviews from other verified users.</p>
                           <div class="community-ring-wrap">
                               <div class="community-ring">
                                   <svg viewBox="0 0 100 100" width="120" height="120">
                                       <circle cx="50" cy="50" r="${c}" fill="none" stroke="#e2e8f0" stroke-width="10"/>
                                       <circle cx="50" cy="50" r="${c}" fill="none" stroke="#555555" stroke-width="10"
                                           stroke-dasharray="${m}" stroke-dashoffset="${p}"
                                           stroke-linecap="round" transform="rotate(-90 50 50)" style="transition:stroke-dashoffset 1s ease;"/>
                                   </svg>
                                   <div class="community-ring-label">${d}<span>/5</span></div>
                               </div>
                               <div class="community-ring-info">
                                   <p style="font-size:1rem;font-weight:700;margin:0 0 4px;">${d} of 5 reviews</p>
                                   <p class="text-muted" style="margin:0;font-size:0.85rem;">${5-d>0?`${5-d} more reviews needed`:"Threshold reached! Badge will update shortly."}</p>
                                   <a href="/dashboard/messages" class="btn btn-outline mt-md btn-sm">View my conversations</a>
                               </div>
                           </div>`}
                </div>
            </div>
        </div>

        <style>
            /* ── Progress Track ── */
            .verif-progress-container { padding: 8px 0 24px; }
            .verif-progress-track { display:flex; justify-content:space-between; position:relative; max-width:560px; margin:0 auto; }
            .verif-track-line { position:absolute; top:21px; left:10%; width:80%; height:4px; background:#e2e8f0; border-radius:4px; z-index:0; }
            .verif-track-fill { height:100%; background:linear-gradient(90deg,#333333,#1a1a1a); border-radius:4px; transition:width 0.8s ease; }
            .verif-step { position:relative; z-index:1; display:flex; flex-direction:column; align-items:center; gap:8px; flex:1; }
            .verif-step-bubble { width:44px; height:44px; background:#e2e8f0; color:#64748b; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:1rem; border:3px solid white; transition:all 0.4s; }
            .verif-step.active .verif-step-bubble { background:var(--primary); color:white; animation:pulse-ring 2s infinite; }
            .verif-step.completed .verif-step-bubble { color:white; }
            .verif-step-label { font-size:0.8rem; font-weight:600; color:#94a3b8; transition:color 0.3s; }
            @keyframes pulse-ring { 0%,100%{box-shadow:0 0 0 4px rgba(27,79,114,0.15);} 50%{box-shadow:0 0 0 8px rgba(99,102,241,0.08);} }

            /* ── Accordion Cards ── */
            .verification-accordion { display:flex; flex-direction:column; gap:16px; margin-bottom:40px; }
            .verif-panel { transition:all 0.3s; overflow:hidden; }
            .verif-panel.active-panel { border-color:var(--primary); box-shadow:0 4px 20px rgba(27,79,114,0.12); background:linear-gradient(135deg,rgba(99,102,241,0.02) 0%,rgba(255,255,255,0) 100%); }
            .verif-panel.verif-completed { border-color:#333333; background:linear-gradient(135deg,rgba(16,185,129,0.03),transparent); }
            .verif-header { display:flex; align-items:center; justify-content:space-between; cursor:pointer; padding:8px 0; user-select:none; }
            .verif-title { display:flex; align-items:center; gap:14px; }
            .verif-icon-wrap { width:48px; height:48px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:1.3rem; flex-shrink:0; }
            .verif-title h3 { margin:0 0 2px; font-size:1.05rem; }
            .verif-title p { margin:0; font-size:0.82rem; color:var(--text-secondary); }
            .verif-status { display:flex; align-items:center; gap:14px; }
            .verif-chevron { transition:transform 0.3s; color:#94a3b8; }
            .verif-body { max-height:0; opacity:0; overflow:hidden; transition:max-height 0.4s ease, opacity 0.3s; border-top:1px solid transparent; }
            .verif-panel.expanded .verif-body { max-height:900px; opacity:1; padding-top:20px; margin-top:16px; border-top-color:var(--border); }
            .verif-panel.expanded .verif-chevron { transform:rotate(180deg); }

            /* ── Body elements ── */
            .verif-success-msg { display:flex; align-items:center; gap:10px; color:#333333; font-weight:600; background:#f5f5f5; padding:14px 18px; border-radius:10px; }
            .verif-success-msg i { font-size:1.3rem; }
            .verif-perk { display:inline-flex; align-items:center; gap:10px; background:#f5f5f5; color:#333333; padding:10px 18px; border-radius:10px; font-size:0.92rem; font-weight:600; margin-bottom:4px; }
            .verif-alert { display:flex; align-items:flex-start; gap:14px; padding:16px 18px; border-radius:10px; font-size:0.9rem; }
            .verif-alert i { font-size:1.3rem; margin-top:2px; flex-shrink:0; }
            .verif-alert-warning { background:#fffbeb; color:#b45309; border:1px solid #fcd34d; }
            .verif-alert-danger { background:#f5f5f5; color:#1a1a1a; border:1px solid #dddddd; }

            /* ── OTP Boxes ── */
            .otp-boxes { display:flex; gap:10px; }
            .otp-box { width:48px; height:56px; border:2px solid var(--border); border-radius:10px; text-align:center; font-size:1.5rem; font-weight:700; background:var(--bg-white); color:var(--text-primary); transition:border-color 0.2s; appearance:none; }
            .otp-box:focus { outline:none; border-color:var(--primary); box-shadow:0 0 0 3px rgba(27,79,114,0.15); }

            /* ── ID Upload Steps ── */
            .id-verif-steps { display:flex; gap:20px; flex-wrap:wrap; margin-top:4px; }
            .id-step-card { flex:1; min-width:240px; background:var(--bg-white); border:1px solid var(--border); border-radius:14px; padding:20px; position:relative; }
            .id-step-number { position:absolute; top:-12px; left:18px; width:28px; height:28px; background:var(--primary); color:white; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:0.85rem; }
            .id-step-card h4 { margin:0 0 4px; font-size:0.95rem; padding-top:4px; }
            .id-upload-box { border:2px dashed #cbd5e1; border-radius:12px; padding:28px 20px; text-align:center; background:#f8fafc; cursor:pointer; transition:all 0.2s; display:block; position:relative; }
            .id-upload-box:hover, .id-upload-box.drag-over { border-color:var(--primary); background:rgba(27,79,114,0.04); }
            .id-preview-check { position:absolute; bottom:8px; right:8px; background:#333333; color:white; border-radius:50%; width:22px; height:22px; display:flex; align-items:center; justify-content:center; font-size:0.75rem; }

            /* ── Camera ── */
            .camera-overlay-ring { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:190px; height:190px; border:3px solid rgba(99,102,241,0.6); border-radius:50%; pointer-events:none; box-shadow:0 0 0 9999px rgba(0,0,0,0.35); }

            /* ── Community Ring ── */
            .community-ring-wrap { display:flex; align-items:center; gap:28px; background:var(--bg-white); border:1px solid var(--border); border-radius:14px; padding:20px; max-width:400px; }
            .community-ring { position:relative; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
            .community-ring-label { position:absolute; font-size:1.5rem; font-weight:800; color:#555555; text-align:center; line-height:1; }
            .community-ring-label span { font-size:0.85rem; color:var(--text-secondary); display:block; font-weight:500; }
        </style>
    `,setTimeout(()=>{const r=e.querySelector("#btn-send-sms"),w=e.querySelector("#sms-otp-block"),S=e.querySelector("#btn-verify-sms"),A=e.querySelector("#btn-resend-sms"),_=e.querySelector("#sms-timer"),$=e.querySelectorAll(".otp-box");let E=null;$.forEach((G,Y)=>{G.addEventListener("input",()=>{G.value.length===1&&Y<5&&$[Y+1].focus(),G.value.length>1&&(G.value=G.value.slice(-1))}),G.addEventListener("keydown",le=>{le.key==="Backspace"&&!G.value&&Y>0&&$[Y-1].focus()})});function T(){let G=60;_&&(_.textContent=G),clearInterval(E),E=setInterval(()=>{if(G--,_&&(_.textContent=G),G<=0){clearInterval(E),A&&(A.style.display="inline-flex");const Y=_?.closest("span");Y&&(Y.style.display="none")}},1e3)}r&&r.addEventListener("click",()=>{if(!e.querySelector("#phone-number")?.value.trim()){te("Please enter a phone number.","error");return}r.innerHTML='<i class="fas fa-spinner fa-spin"></i> Sending...',r.disabled=!0,setTimeout(()=>{w.style.display="block",$[0].focus(),r.innerHTML="Code Sent!",te("Verification code sent! (Demo: any 6-digit code works)","success"),T()},1200)}),A&&A.addEventListener("click",()=>{A.style.display="none";const G=_?.closest("span");G&&(G.style.display=""),$.forEach(Y=>Y.value=""),$[0].focus(),te("New code sent!","success"),T()}),S&&S.addEventListener("click",()=>{if(Array.from($).map(Y=>Y.value).join("").length<6){te("Enter all 6 digits.","error");return}S.innerHTML='<i class="fas fa-spinner fa-spin"></i> Verifying...',S.disabled=!0,setTimeout(()=>{clearInterval(E);const Y=u.users.update(t.id||t.user_id,{phone_verified:!0,verification_level:t.verification_level==="basic"?"phone":t.verification_level});te("Phone verified successfully! 🎉","success"),Ze(e,Y||{...t,phone_verified:!0})},1200)});const j=e.querySelector("#id-photo-input"),M=e.querySelector("#btn-submit-id"),R=e.querySelector("#id-drop-zone");let F=!1,H=!1,x=null,O=null;function pe(){M&&(M.disabled=!(F&&H))}R&&(R.addEventListener("dragover",G=>{G.preventDefault(),R.classList.add("drag-over")}),R.addEventListener("dragleave",()=>R.classList.remove("drag-over")),R.addEventListener("drop",G=>{G.preventDefault(),R.classList.remove("drag-over");const Y=G.dataTransfer.files[0];if(Y&&Y.type.startsWith("image/")){x=Y,F=!0;const le=new FileReader;le.onload=Me=>{e.querySelector("#id-photo-preview").style.display="block",e.querySelector("#id-photo-preview img").src=Me.target.result},le.readAsDataURL(Y),pe()}})),j&&j.addEventListener("change",G=>{if(G.target.files.length>0){x=G.target.files[0],F=!0;const Y=new FileReader;Y.onload=le=>{e.querySelector("#id-photo-preview").style.display="block",e.querySelector("#id-photo-preview img").src=le.target.result},Y.readAsDataURL(x),pe()}});const J=e.querySelector("#btn-selfie-cam"),ue=e.querySelector("#selfie-camera-wrap"),xe=e.querySelector("#selfie-idle"),me=e.querySelector("#selfie-preview"),re=e.querySelector("#selfie-img"),we=e.querySelector("#selfie-video"),z=e.querySelector("#btn-capture-selfie"),N=e.querySelector("#btn-cancel-camera"),ne=e.querySelector("#btn-retake-selfie");async function de(){try{O=await navigator.mediaDevices.getUserMedia({video:{facingMode:"user"},audio:!1}),we.srcObject=O,xe.style.display="none",ue.style.display="block",me.style.display="none"}catch{te("Camera access denied. Please allow camera permission.","error")}}function Q(){O&&(O.getTracks().forEach(G=>G.stop()),O=null)}J&&J.addEventListener("click",de),z&&z.addEventListener("click",()=>{const G=document.createElement("canvas");G.width=we.videoWidth||320,G.height=we.videoHeight||240,G.getContext("2d").drawImage(we,0,0),Q(),G.toBlob(Y=>{H=!0;const le=URL.createObjectURL(Y);re.src=le,ue.style.display="none",me.style.display="block",pe()},"image/jpeg",.9)}),N&&N.addEventListener("click",()=>{Q(),ue.style.display="none",xe.style.display="block"}),ne&&ne.addEventListener("click",()=>{H=!1,me.style.display="none",xe.style.display="block",re.src="",pe()}),e.querySelector("#btn-retry-id")&&e.querySelector("#btn-retry-id").addEventListener("click",()=>{u.users.update(t.id||t.user_id,{id_status:null,id_rejection_reason:null}),Ze(e,{...t,id_status:null,id_rejection_reason:null})}),M&&M.addEventListener("click",async()=>{M.disabled=!0,M.innerHTML='<i class="fas fa-spinner fa-spin"></i> Processing...';try{const G=u.users.update(t.id||t.user_id,{id_status:"pending",verification_id_photo:"",verification_selfie:""});te("ID Verification submitted! We'll review within 24 hours. 🛡️","success"),Ze(e,G||{...t,id_status:"pending"})}catch(G){console.error("Verification submission error:",G),te("Submission failed. Please try again.","error"),M.innerHTML='<i class="fas fa-shield-halved"></i> Submit for Verification',M.disabled=!1}})},0)}const ut="rg_draft_listing",mt={step:1,category:"",city:"",neighborhood:"",address:"",title:"",price:"",currency:"USD",availableFrom:"",leaseDuration:"",roomType:"",furnished:"",bedrooms:"",bathrooms:"",sizeSqft:"",budgetMin:"",budgetMax:"",preferredArea:"",moveInTimeline:"",amenities:[],photos:[],description:"",prefGender:"Any",prefAgeMin:18,prefAgeMax:99,lifestyleTags:[]};let k={...mt};function Oi(){const e=localStorage.getItem(ut);if(e)try{k={...mt,...JSON.parse(e)}}catch(t){console.error("Error loading draft",t)}}function st(){localStorage.setItem(ut,JSON.stringify(k))}function Gi(){localStorage.removeItem(ut),k={...mt}}function ot(e,t,a,i){return new Promise(s=>{let o=e.width,n=e.height;const l=Math.min(t/o,a/n,1);o=Math.round(o*l),n=Math.round(n*l);const d=document.createElement("canvas");d.width=o,d.height=n,d.getContext("2d").drawImage(e,0,0,o,n),d.toBlob(v=>{s(v)},"image/webp",i)})}async function Wi(e){return new Promise((t,a)=>{const i=new FileReader;i.onload=s=>{const o=new Image;o.onload=async()=>{try{const[n,l,d]=await Promise.all([ot(o,400,300,.72),ot(o,960,720,.8),ot(o,1600,1200,.85)]);try{const[v,b,y]=await Promise.all([Pe(n,"thumb.webp"),Pe(l,"medium.webp"),Pe(d,"full.webp")]);t({thumb:v,medium:b,full:y})}catch(v){console.warn("[LISTING] Server upload failed, falling back to Base64:",v);const b=h=>new Promise(c=>{const m=new FileReader;m.onload=p=>c(p.target.result),m.readAsDataURL(h)}),[y,g,f]=await Promise.all([b(n),b(l),b(d)]);t({thumb:y,medium:g,full:f,isLocal:!0})}}catch(n){a(n)}},o.onerror=()=>a(new Error("Image failed to load")),o.src=s.target.result},i.onerror=()=>a(new Error("File reader failed")),i.readAsDataURL(e)})}function Wt(e,t){return e?typeof e=="string"?e:e[t]||e.medium||e.full||e.thumb||"":""}function Vi(){const e=["Category","Location","Details","Amenities","Photos","Description","Publish"];return`
        <nav class="pl-progress" aria-label="Listing steps">
            <div class="pl-steps-track">
                <div class="pl-track-bg"></div>
                <div class="pl-track-fill" style="width:${(k.step-1)/(e.length-1)*100}%"></div>
                <ol class="pl-steps-list">
                    ${e.map((a,i)=>{const s=i+1;return`
                        <li class="pl-step ${s<k.step?"completed":s===k.step?"active":"upcoming"}">
                            <div class="pl-step-circle">
                                ${s<k.step?'<i class="fa-solid fa-check"></i>':`<span>${s}</span>`}
                            </div>
                            <span class="pl-step-label">${a}</span>
                        </li>`}).join("")}
                </ol>
            </div>
        </nav>
    `}const Yi={room:{icon:"fa-bed",label:"Room for Rent",desc:"I have a room available in a shared property.",bg:"#f5f5f5",color:"#1a1a1a"},apartment:{icon:"fa-building",label:"Apartment for Rent",desc:"I am renting out an entire property.",bg:"#f5f5f5",color:"#1a1a1a"},sublet:{icon:"fa-calendar-alt",label:"Sublet",desc:"I need someone to take over my lease.",bg:"#f5f5f5",color:"#1a1a1a"},roommate_wanted:{icon:"fa-users",label:"Roommate Wanted",desc:"Looking for a roommate to find a place with.",bg:"#f5f5f5",color:"#1a1a1a"}};function Ct(){return`
        <div class="post-listing-step" id="step-1">
            <div class="pl-step-header">
                <h2>What kind of listing are you creating?</h2>
                <p class="step-subtitle">Select the category that best matches what you're posting.</p>
            </div>
            <div class="category-cards">
                ${Object.entries(Yi).map(([e,t])=>`
                    <div class="category-card ${k.category===e?"selected":""}" data-cat="${e}">
                        <div class="cat-icon-wrap" style="background:${t.bg}">
                            <i class="fa-solid ${t.icon}" style="color:${t.color}"></i>
                        </div>
                        <div class="cat-card-body">
                            <h3>${t.label}</h3>
                            <p>${t.desc}</p>
                        </div>
                        <div class="cat-check"><i class="fa-solid fa-circle-check"></i></div>
                    </div>
                `).join("")}
            </div>
            <div class="step-actions">
                <span></span>
                <button class="btn btn-primary pl-btn-next" id="btn-next" ${k.category?"":"disabled"}>
                    Next Step <i class="fa-solid fa-arrow-right"></i>
                </button>
            </div>
        </div>
    `}function Ji(){const e=u.cities.findAll();let t='<option value="">Select Neighborhood</option>';if(k.city){const a=u.neighborhoods.find(i=>i.city===k.city);t+=a.map(i=>`<option value="${i.neighborhood_id}" ${k.neighborhood===i.neighborhood_id?"selected":""}>${i.name}</option>`).join("")}return`
        <div class="pl-step-content animate__animated animate__fadeIn" id="step-2">
            <div class="pl-step-header">
                <h2 class="pl-step-title">Location Details</h2>
                <p class="pl-step-subtitle">Where is your place located?</p>
            </div>
            <div class="pl-form-grid">
                <div class="form-group">
                    <label class="pl-label">City <span class="required-asterisk">*</span></label>
                    <select id="pl-city" class="form-control">
                        <option value="">Select a city</option>
                        ${e.map(a=>`<option value="${a.city_id}" ${k.city===a.city_id?"selected":""}>${a.name}</option>`).join("")}
                    </select>
                </div>
                <div class="form-group">
                    <label class="pl-label">Neighborhood <span class="pl-optional">Optional</span></label>
                    <select id="pl-neighborhood" class="form-control" ${k.city?"":"disabled"}>
                        ${t}
                    </select>
                </div>
                <div class="form-group">
                    <label class="pl-label">Street Address <span class="pl-optional">Optional</span></label>
                    <div class="pl-input-group">
                        <input type="text" id="pl-address" class="form-control" placeholder="e.g. 123 Main St" value="${k.address||""}">
                        <button class="btn btn-outline pl-location-btn" id="btn-use-location">
                            <i class="fa-solid fa-location-crosshairs"></i> Use Current
                        </button>
                    </div>
                    <small class="form-help">Exact address is only shared with verified users you connect with.</small>
                </div>
            </div>
            <div class="mock-map-container">
                <div class="mock-map">
                    ${k.city?'<iframe width="100%" height="100%" frameborder="0" scrolling="no" src="https://www.openstreetmap.org/export/embed.html?bbox=-97.9,30.1,-97.5,30.4&amp;layer=mapnik"></iframe>':'<div class="map-placeholder"><i class="fa-solid fa-map-location-dot"></i><p>Select a city to preview the map</p></div>'}
                </div>
            </div>
            <div class="step-actions">
                <button class="btn btn-outline pl-btn-back" id="btn-prev"><i class="fa-solid fa-arrow-left"></i> Back</button>
                <button class="btn btn-primary pl-btn-next" id="btn-next" ${k.city?"":"disabled"}>
                    Next Step <i class="fa-solid fa-arrow-right"></i>
                </button>
            </div>
        </div>
    `}function Ki(){const e=k.category==="roommate_wanted";let t=`
        <div class="post-listing-step" id="step-3">
            <div class="pl-step-header">
                <h2>The Details</h2>
                <p class="step-subtitle">Let's get into the specifics of what you're offering.</p>
            </div>
            <div class="pl-form-card">
                <div class="form-group">
                    <label class="pl-label">Listing Title <span class="required-asterisk">*</span></label>
                    <input type="text" id="pl-title" class="form-control" placeholder="e.g. Sunny Room Near Downtown" value="${k.title||""}">
                </div>
    `;return e?t+=`
                <div class="form-row">
                    <div class="form-group">
                        <label class="pl-label">Budget Min</label>
                        <input type="number" id="pl-budget-min" class="form-control" placeholder="500" value="${k.budgetMin||""}">
                    </div>
                    <div class="form-group">
                        <label class="pl-label">Budget Max</label>
                        <input type="number" id="pl-budget-max" class="form-control" placeholder="1,500" value="${k.budgetMax||""}">
                    </div>
                </div>
                <div class="form-group">
                    <label class="pl-label">Preferred Areas/Neighborhoods</label>
                    <input type="text" id="pl-pref-area" class="form-control" placeholder="e.g. Downtown or Southside" value="${k.preferredArea||""}">
                </div>
                <div class="form-group">
                    <label class="pl-label">Move-in Timeline</label>
                    <select id="pl-timeline" class="form-control">
                        <option value="">Select timeline</option>
                        ${["ASAP","Within 30 days","1-3 Months","Flexible"].map(a=>`
                            <option value="${a}" ${k.moveInTimeline===a?"selected":""}>${a}</option>
                        `).join("")}
                    </select>
                </div>
        `:t+=`
                <div class="form-row">
                    <div class="form-group">
                        <label class="pl-label">Monthly Rent</label>
                        <div class="pl-input-group">
                            <select id="pl-currency" class="form-control pl-currency-select">
                                <option value="USD">$</option>
                                <option value="EUR" ${k.currency==="EUR"?"selected":""}>€</option>
                                <option value="GBP" ${k.currency==="GBP"?"selected":""}>£</option>
                            </select>
                            <input type="number" id="pl-price" class="form-control" placeholder="1,200" value="${k.price||""}">
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="pl-label">Available From</label>
                        <input type="date" id="pl-date" class="form-control" value="${k.availableFrom||""}">
                    </div>
                </div>
                <div class="form-group">
                    <label class="pl-label">Lease Duration</label>
                    <div class="radio-pill-group">
                        ${["<3 months","3-6 months","6-12 months","12+ months","Flexible"].map(a=>`
                            <label class="radio-pill">
                                <input type="radio" name="pl-lease" value="${a}" ${k.leaseDuration===a?"checked":""}>
                                <span>${a}</span>
                            </label>
                        `).join("")}
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="pl-label">Room Type</label>
                        <select id="pl-roomtype" class="form-control">
                            <option value="">Select type</option>
                            ${["Private Room","Shared Room","Entire Place","Studio"].map(a=>`
                                <option value="${a}" ${k.roomType===a?"selected":""}>${a}</option>
                            `).join("")}
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="pl-label">Furnished?</label>
                        <div class="radio-pill-group">
                            ${["Yes","No","Partially"].map(a=>`
                                <label class="radio-pill">
                                    <input type="radio" name="pl-furnished" value="${a}" ${k.furnished===a?"checked":""}>
                                    <span>${a}</span>
                                </label>
                            `).join("")}
                        </div>
                    </div>
                </div>
                <div class="form-row form-row-3">
                    <div class="form-group">
                        <label class="pl-label">Bedrooms</label>
                        <input type="number" id="pl-beds" class="form-control" min="0" value="${k.bedrooms||""}">
                    </div>
                    <div class="form-group">
                        <label class="pl-label">Bathrooms</label>
                        <input type="number" id="pl-baths" class="form-control" min="0" value="${k.bathrooms||""}">
                    </div>
                    <div class="form-group">
                        <label class="pl-label">Sqft <span class="pl-optional">Optional</span></label>
                        <input type="number" id="pl-sqft" class="form-control" value="${k.sizeSqft||""}">
                    </div>
                </div>
        `,t+=`
            </div>
            <div class="step-actions">
                <button class="btn btn-outline pl-btn-back" id="btn-prev"><i class="fa-solid fa-arrow-left"></i> Back</button>
                <button class="btn btn-primary pl-btn-next" id="btn-next" ${k.title&&k.title.length>=5?"":"disabled"}>
                    Next Step <i class="fa-solid fa-arrow-right"></i>
                </button>
            </div>
        </div>
    `,t}function Qi(){return`
        <div class="post-listing-step" id="step-4">
            <div class="pl-step-header">
                <h2>Amenities</h2>
                <p class="step-subtitle">What does the property offer? Select all that apply.</p>
            </div>
            <div class="amenities-grid">
                ${u.amenities.findAll().map(t=>`
                    <label class="custom-checkbox-card ${k.amenities.includes(t.amenity_id)?"checked":""}">
                        <input type="checkbox" value="${t.amenity_id}" ${k.amenities.includes(t.amenity_id)?"checked":""} class="amenity-cb">
                        <i class="fa-solid ${t.icon}"></i>
                        <span>${t.name}</span>
                        <div class="amenity-check"><i class="fa-solid fa-check"></i></div>
                    </label>
                `).join("")}
            </div>
            <div class="step-actions">
                <button class="btn btn-outline pl-btn-back" id="btn-prev"><i class="fa-solid fa-arrow-left"></i> Back</button>
                <button class="btn btn-primary pl-btn-next" id="btn-next">
                    Next Step <i class="fa-solid fa-arrow-right"></i>
                </button>
            </div>
        </div>
    `}function Zi(){return`
        <div class="post-listing-step" id="step-5">
            <div class="pl-step-header">
                <h2>Photos</h2>
                <p class="step-subtitle">Upload up to 10 photos. The first photo will be used as the cover image.</p>
            </div>
            <div class="photo-upload-zone ${k.photos.length>0?"has-photos":""}" id="pl-dropzone">
                <div class="upload-content">
                    <div class="upload-icon-circle">
                        <i class="fa-solid fa-cloud-arrow-up"></i>
                    </div>
                    <h4>Drag &amp; drop photos here</h4>
                    <p>or <span class="upload-browse-link">click to browse</span> (JPG, PNG, WebP · Max 5MB each)</p>
                    <input type="file" id="pl-file-input" multiple accept="image/jpeg,image/png,image/webp" style="display:none">
                </div>
            </div>
            ${k.photos.length>0?`
            <div class="photo-preview-grid" id="pl-photo-grid">
                ${k.photos.map((e,t)=>`
                    <div class="photo-thumbnail">
                        <img src="${Wt(e,"thumb")}" alt="Upload preview ${t+1}">
                        ${t===0?'<div class="cover-badge">COVER</div>':""}
                        <button class="btn-remove-photo" data-idx="${t}" aria-label="Remove photo"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                `).join("")}
            </div>`:""}
            <div class="step-actions">
                <button class="btn btn-outline pl-btn-back" id="btn-prev"><i class="fa-solid fa-arrow-left"></i> Back</button>
                <button class="btn btn-primary pl-btn-next" id="btn-next">
                    Next Step <i class="fa-solid fa-arrow-right"></i>
                </button>
            </div>
        </div>
    `}function Xi(){const e=u.tags.findAll();return`
        <div class="post-listing-step" id="step-6">
            <div class="pl-step-header">
                <h2>Description &amp; Preferences</h2>
                <p class="step-subtitle">Tell potential roommates about the place and who you're looking for.</p>
            </div>
            <div class="pl-form-card">
                <div class="form-group">
                    <div class="pl-label-row">
                        <label class="pl-label" style="margin:0">Description <span class="required-asterisk">*</span></label>
                        <button class="btn btn-sm btn-outline ai-assist-btn" id="btn-ai-assist">
                            <i class="fa-solid fa-wand-magic-sparkles"></i> AI Assist
                        </button>
                    </div>
                    <textarea id="pl-desc" class="form-control" rows="6" maxlength="2000" placeholder="Describe the space, atmosphere, neighborhood perks, house rules...">${k.description||""}</textarea>
                    <div class="pl-desc-footer">
                        <span class="form-help">At least 50 characters required</span>
                        <span class="char-count" id="pl-desc-count">${k.description?k.description.length:0} / 2000</span>
                    </div>
                </div>
            </div>

            <div class="pl-prefs-section">
                <h3 class="pl-prefs-title">Roommate Preferences</h3>
                <div class="pl-form-card">
                    <div class="form-group">
                        <label class="pl-label">Preferred Gender</label>
                        <div class="radio-pill-group">
                            ${["Any","Male","Female","Non-binary"].map(t=>`
                                <label class="radio-pill">
                                    <input type="radio" name="pl-pref-gender" value="${t}" ${k.prefGender===t?"checked":""}>
                                    <span>${t}</span>
                                </label>
                            `).join("")}
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="pl-label">Age Range: <span id="pl-age-val" class="pl-age-display">${k.prefAgeMin} – ${k.prefAgeMax}</span></label>
                        <div class="pl-range-row">
                            <span class="range-hint">18</span>
                            <input type="range" id="pl-age-min" min="18" max="99" value="${k.prefAgeMin}">
                            <input type="range" id="pl-age-max" min="18" max="99" value="${k.prefAgeMax}">
                            <span class="range-hint">99</span>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="pl-label">Lifestyle Preferences</label>
                        <div class="lifestyle-tags">
                            ${e.map(t=>`
                                <label class="lifestyle-tag ${k.lifestyleTags.includes(t.tag_id)?"active":""}">
                                    <input type="checkbox" value="${t.tag_id}" class="pref-tag-cb" ${k.lifestyleTags.includes(t.tag_id)?"checked":""}>
                                    <i class="fa-solid ${t.icon}"></i> ${t.name}
                                </label>
                            `).join("")}
                        </div>
                    </div>
                </div>
            </div>

            <div class="step-actions">
                <button class="btn btn-outline pl-btn-back" id="btn-prev"><i class="fa-solid fa-arrow-left"></i> Back</button>
                <button class="btn btn-primary pl-btn-next" id="btn-next" ${k.description.length>=50?"":"disabled"}>
                    Preview Listing <i class="fa-solid fa-eye"></i>
                </button>
            </div>
        </div>
    `}function ea(){return`
        <div class="post-listing-step" id="step-7">
            <div class="pl-step-header">
                <div class="pl-publish-icon"><i class="fa-solid fa-rocket"></i></div>
                <h2>Ready to Publish!</h2>
                <p class="step-subtitle">Review your listing one last time before it goes live.</p>
            </div>

            <div class="preview-card">
                ${k.photos.length>0?`<img src="${Wt(k.photos[0],"medium")}" class="preview-hero" alt="Cover photo">`:'<div class="preview-hero placeholder"><i class="fa-solid fa-image"></i><span>No cover photo</span></div>'}
                <div class="preview-content">
                    <div class="preview-header">
                        <h3>${k.title||"Untitled Listing"}</h3>
                        <div class="preview-price">
                            ${k.category==="roommate_wanted"?k.budgetMin||k.budgetMax?`$${k.budgetMin||"0"} – $${k.budgetMax||"∞"}<span>/mo budget</span>`:'<span style="font-size:0.9rem;font-weight:500;">Budget TBD</span>':`$${k.price||"0"}<span>/mo</span>`}
                        </div>
                    </div>
                    <div class="preview-meta">
                        <span><i class="fa-solid fa-location-dot"></i> ${k.address||"Location set"}</span>
                        <span><i class="fa-solid fa-calendar"></i> ${k.availableFrom||"ASAP"}</span>
                        ${k.amenities.length>0?`<span><i class="fa-solid fa-star"></i> ${k.amenities.length} amenities</span>`:""}
                    </div>
                    ${k.description?`<p class="preview-desc">${k.description.slice(0,180)}${k.description.length>180?"…":""}</p>`:""}
                </div>
            </div>

            <div class="publish-options">
                <label class="publish-option-card selected">
                    <input type="radio" name="publish_type" value="free" checked>
                    <div class="po-icon po-free"><i class="fa-solid fa-house"></i></div>
                    <div class="po-content">
                        <h4>Standard Listing</h4>
                        <p>Visible to all users, standard search placement</p>
                    </div>
                    <div class="po-price">Free</div>
                </label>
                <label class="publish-option-card">
                    <input type="radio" name="publish_type" value="featured">
                    <div class="po-icon po-featured"><i class="fa-solid fa-bolt"></i></div>
                    <div class="po-content">
                        <h4>Featured Listing</h4>
                        <p>Top placement in search + highlighted badge</p>
                    </div>
                    <div class="po-price">$10/wk</div>
                    <div class="po-badge">Popular</div>
                </label>
            </div>

            <div class="pl-terms-row">
                <input type="checkbox" id="pl-terms" class="pl-checkbox">
                <label for="pl-terms">
                    I agree to the Terms of Service and confirm this listing complies with local housing laws.
                </label>
            </div>

            <div class="step-actions">
                <button class="btn btn-outline pl-btn-back" id="btn-prev"><i class="fa-solid fa-arrow-left"></i> Edit Draft</button>
                <button class="btn btn-success pl-btn-publish" id="btn-publish" disabled>
                    <i class="fa-solid fa-rocket"></i> Publish Listing
                </button>
            </div>
        </div>
    `}function ta(e){const t=e.querySelector("#btn-next"),a=e.querySelector("#btn-prev"),i=e.querySelector("#btn-publish");if(t&&t.addEventListener("click",()=>{It(),k.step++,st(),Re(e)}),a&&a.addEventListener("click",()=>{It(),k.step>1&&k.step--,st(),Re(e)}),i&&i.addEventListener("click",ia),k.step===1&&e.querySelectorAll(".category-card").forEach(s=>{s.addEventListener("click",o=>{e.querySelectorAll(".category-card").forEach(n=>n.classList.remove("selected")),o.currentTarget.classList.add("selected"),k.category=o.currentTarget.dataset.cat,t&&(t.disabled=!1)})}),k.step===2){const s=e.querySelector("#pl-city"),o=e.querySelector("#pl-address");s.addEventListener("change",n=>{k.city=n.target.value,k.neighborhood="",st(),t&&(t.disabled=!k.city),Re(e)}),e.querySelector("#btn-use-location").addEventListener("click",()=>{o.value="Austonian Dr",k.address=o.value})}if(k.step===3&&e.querySelector("#pl-title").addEventListener("input",o=>{k.title=o.target.value,t&&(t.disabled=k.title.length<5)}),k.step===4&&e.querySelectorAll(".custom-checkbox-card input").forEach(s=>{s.addEventListener("change",o=>{const n=o.target.closest(".custom-checkbox-card");o.target.checked?(n.classList.add("checked"),k.amenities.includes(o.target.value)||k.amenities.push(o.target.value)):(n.classList.remove("checked"),k.amenities=k.amenities.filter(l=>l!==o.target.value))})}),k.step===5){const s=e.querySelector("#pl-dropzone"),o=e.querySelector("#pl-file-input");s.addEventListener("click",()=>o.click()),s.addEventListener("dragover",n=>{n.preventDefault(),s.classList.add("dragover")}),s.addEventListener("dragleave",()=>s.classList.remove("dragover")),s.addEventListener("drop",async n=>{n.preventDefault(),s.classList.remove("dragover"),n.dataTransfer.files.length>0&&Tt(n.dataTransfer.files,e)}),o.addEventListener("change",n=>{n.target.files.length>0&&Tt(n.target.files,e)}),e.querySelectorAll(".btn-remove-photo").forEach(n=>{n.addEventListener("click",l=>{l.stopPropagation();const d=parseInt(l.currentTarget.dataset.idx);k.photos.splice(d,1),Re(e)})})}if(k.step===6){const s=e.querySelector("#pl-desc"),o=e.querySelector("#pl-desc-count"),n=e.querySelector("#btn-ai-assist");s.addEventListener("input",y=>{const g=y.target.value.length;o.textContent=`${g} / 2000`,k.description=y.target.value,t&&(t.disabled=g<50)}),n.addEventListener("click",()=>{const y=`Stunning ${k.category?k.category.replace("_"," "):"place"} located in a prime area. Features include ${k.amenities.length} amenities, ready for move-in. Perfect for those looking for a comfortable living situation. Reach out to schedule a viewing!`;s.value=y,k.description=y,o.textContent=`${y.length} / 2000`,t&&(t.disabled=!1)});const l=e.querySelector("#pl-age-min"),d=e.querySelector("#pl-age-max"),v=e.querySelector("#pl-age-val"),b=()=>{let y=parseInt(l.value),g=parseInt(d.value);y>g&&(y=g,l.value=y),v.textContent=`${y} – ${g}`,k.prefAgeMin=y,k.prefAgeMax=g};l.addEventListener("input",b),d.addEventListener("input",b),e.querySelectorAll(".pref-tag-cb").forEach(y=>{y.addEventListener("change",g=>{const f=g.target.closest(".lifestyle-tag");g.target.checked?(f.classList.add("active"),k.lifestyleTags.includes(g.target.value)||k.lifestyleTags.push(g.target.value)):(f.classList.remove("active"),k.lifestyleTags=k.lifestyleTags.filter(h=>h!==g.target.value))})}),e.querySelectorAll('input[name="pl-pref-gender"]').forEach(y=>{y.addEventListener("change",g=>{k.prefGender=g.target.value})})}k.step===7&&(e.querySelector("#pl-terms").addEventListener("change",o=>{i&&(i.disabled=!o.target.checked)}),e.querySelectorAll(".publish-option-card").forEach(o=>{o.addEventListener("click",n=>{e.querySelectorAll(".publish-option-card").forEach(l=>l.classList.remove("selected")),n.currentTarget.classList.add("selected"),n.currentTarget.querySelector("input").checked=!0})}))}async function Tt(e,t){const a=["image/jpeg","image/png","image/webp"],s=Array.from(e).slice(0,10-k.photos.length).filter(l=>a.includes(l.type)?l.size>5242880?(alert(`"${l.name}" exceeds the 5 MB limit.`),!1):!0:(alert(`"${l.name}" is not a supported format. Use JPG, PNG, or WebP.`),!1));if(s.length===0)return;const o=t.querySelector("#pl-dropzone");o.innerHTML='<div class="upload-content"><div class="upload-processing"><i class="fa-solid fa-spinner fa-spin"></i><p>Uploading and processing photos…</p></div></div>';let n=null;for(const l of s)try{const d=await Wi(l);k.photos.push(d)}catch(d){console.error("[Upload] Failed for file:",l.name,d),n=d;break}n&&alert("One or more uploads failed. Is the server running?"),Re(t)}function It(){const e=document.querySelector("#post-listing-root");if(e){if(k.step===2){const t=e.querySelector("#pl-neighborhood");t&&(k.neighborhood=t.value);const a=e.querySelector("#pl-address");a&&(k.address=a.value)}if(k.step===3)if(k.category!=="roommate_wanted"){const t=e.querySelector("#pl-price");t&&(k.price=parseInt(t.value)||0);const a=e.querySelector("#pl-currency");a&&(k.currency=a.value);const i=e.querySelector("#pl-date");i&&(k.availableFrom=i.value);const s=e.querySelector("#pl-roomtype");s&&(k.roomType=s.value);const o=e.querySelector('input[name="pl-lease"]:checked');o&&(k.leaseDuration=o.value);const n=e.querySelector('input[name="pl-furnished"]:checked');n&&(k.furnished=n.value);const l=e.querySelector("#pl-beds");l&&(k.bedrooms=l.value!==""?parseInt(l.value):"");const d=e.querySelector("#pl-baths");d&&(k.bathrooms=d.value!==""?parseInt(d.value):"");const v=e.querySelector("#pl-sqft");v&&(k.sizeSqft=v.value!==""?parseInt(v.value):"")}else{const t=e.querySelector("#pl-budget-min");t&&(k.budgetMin=parseInt(t.value)||0);const a=e.querySelector("#pl-budget-max");a&&(k.budgetMax=parseInt(a.value)||0);const i=e.querySelector("#pl-pref-area");i&&(k.preferredArea=i.value);const s=e.querySelector("#pl-timeline");s&&(k.moveInTimeline=s.value)}}}async function ia(){const e=ee();if(!e){alert("You must be signed in to publish a listing."),X("/auth/login");return}const t=document.querySelector("#btn-publish");t&&(t.disabled=!0,t.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> Publishing…');const a=document.querySelector("#post-listing-root"),i=a?a.querySelector('input[name="publish_type"]:checked')?.value==="featured":!1,s={user_id:e.id,category:k.category,title:k.title,description:k.description,price:k.price,currency:k.currency,city:k.city,neighborhood:k.neighborhood,address:k.address,room_type:k.roomType,available_from:k.availableFrom,lease_duration:k.leaseDuration,furnished:k.furnished,amenities:k.amenities,photos:k.photos,roommate_prefs:{gender:k.prefGender,ageMin:k.prefAgeMin,ageMax:k.prefAgeMax,tags:k.lifestyleTags},status:"active",moderation_status:"pending",is_featured:i,views_count:0,bedrooms:parseInt(k.bedrooms)||null,bathrooms:parseInt(k.bathrooms)||null,size_sqft:parseInt(k.sizeSqft)||null};try{u.listings.create(s),Gi();const o=document.createElement("div");o.className="toast toast-success",o.textContent="Listing published successfully!",document.body.appendChild(o),requestAnimationFrame(()=>{requestAnimationFrame(()=>{o.classList.add("visible")})}),setTimeout(()=>{o.classList.remove("visible"),setTimeout(()=>o.remove(),300)},3e3),X("/dashboard")}catch(o){console.error("[Publish] Failed to create listing:",o),alert("Failed to publish listing. Please try again."),t&&(t.disabled=!1,t.innerHTML='<i class="fa-solid fa-rocket"></i> Publish Listing')}}function Re(e){window.scrollTo(0,0);const a=({1:Ct,2:Ji,3:Ki,4:Qi,5:Zi,6:Xi,7:ea}[k.step]||Ct)();e.innerHTML=`
        ${se()}
        <div class="post-listing-page">
            <div class="post-listing-container">
                ${Vi()}
                <div class="step-content-wrapper fade-in">
                    ${a}
                </div>
            </div>
        </div>
    `,ta(e),setTimeout(()=>ce(),0)}function aa(e){if(!ee()){e.innerHTML=`
            <div class="auth-page">
                <div class="auth-card" style="text-align:center;">
                    <h2>Sign In Required</h2>
                    <p>You need an account to post a listing.</p>
                    <a href="/auth/login" class="btn btn-primary mt-md" style="display:inline-block;width:auto;">Sign In</a>
                </div>
            </div>
        `;return}Oi(),e.innerHTML='<div id="post-listing-root"></div>',Re(e.querySelector("#post-listing-root"))}const Vt="https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1600&h=700&fit=crop",sa="https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600&h=400&fit=crop";function Yt(e,t){try{const a=(t.slug||"").toLowerCase(),i=u.cities.findOne(b=>(b.slug||"").toLowerCase()===a);if(!i){e.innerHTML=`
            <div class="container py-xl text-center">
                <h2>City not found</h2>
                <p>Sorry, we couldn't find the city you're looking for.</p>
                <a href="/" class="btn btn-primary mt-lg">Back to Home</a>
            </div>
        `;return}const s=i.hero_image||Vt,o=u.listings.find(b=>b.city===i.city_id&&b.status==="active"),n=(u.neighborhoods?u.neighborhoods.find(b=>b.city===i.city_id):[]).slice(0,8),l=u.listings.findMany({city:i.city_id,category:"roommate_wanted"}),d=u.users.find(b=>b.city===i.city_id&&b.role!=="admin").length,v=o.length>0?Math.round(o.reduce((b,y)=>b+(y.price||0),0)/o.length):0;e.innerHTML=`
        ${se()}
        <div class="city-page">

            <!-- ── HERO ── -->
            <section class="city-hero" style="background-image: url('${s}')">
                <div class="city-hero-overlay">
                    <div class="container city-hero-content">
                        <nav class="city-breadcrumb">
                            <a href="/">Home</a>
                            <i class="fa-solid fa-chevron-right"></i>
                            <a href="/cities">Cities</a>
                            <i class="fa-solid fa-chevron-right"></i>
                            <span>${i.name}</span>
                        </nav>
                        <h1 class="city-hero-title">Rooms &amp; Roommates<br>in ${i.name}</h1>
                        <p class="city-hero-sub">Find your perfect room or roommate in ${i.name}'s most vibrant neighborhoods</p>
                        <div class="city-hero-stats">
                            <div class="hero-stat-pill">
                                <div class="hero-stat-icon"><i class="fa-solid fa-house"></i></div>
                                <div class="hero-stat-text">
                                    <strong>${o.length}</strong>
                                    <span>Listings</span>
                                </div>
                            </div>
                            <div class="hero-stat-pill">
                                <div class="hero-stat-icon"><i class="fa-solid fa-tag"></i></div>
                                <div class="hero-stat-text">
                                    <strong>${v>0?"$"+v+"/mo":"—"}</strong>
                                    <span>Avg. Rent</span>
                                </div>
                            </div>
                            <div class="hero-stat-pill">
                                <div class="hero-stat-icon"><i class="fa-solid fa-users"></i></div>
                                <div class="hero-stat-text">
                                    <strong>${d.toLocaleString()}</strong>
                                    <span>Members</span>
                                </div>
                            </div>
                        </div>
                        <div class="city-search-bar">
                            <div class="search-field">
                                <i class="fa-solid fa-location-dot"></i>
                                <input type="text" value="${i.name}" disabled>
                            </div>
                            <div class="search-bar-divider"></div>
                            <div class="search-field">
                                <i class="fa-solid fa-filter"></i>
                                <select id="listing-type">
                                    <option value="room">Room</option>
                                    <option value="apartment">Apartment</option>
                                    <option value="roommate">Roommate</option>
                                </select>
                            </div>
                            <button class="btn btn-primary search-bar-btn">
                                <i class="fa-solid fa-magnifying-glass"></i> Search
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            <!-- ── AVAILABLE ROOMS ── -->
            <section class="city-section">
                <div class="container">
                    <div class="city-section-header">
                        <div>
                            <h2>Available Rooms in ${i.name}</h2>
                            <p>Browse the latest verified listings in the ${i.name} area.</p>
                        </div>
                        <a href="/search/rooms?city=${i.slug}" class="btn btn-outline btn-sm">
                            View All ${o.length} <i class="fa-solid fa-arrow-right"></i>
                        </a>
                    </div>
                    ${o.length>0?`<div class="listings-grid">${o.slice(0,6).map(b=>oa(b)).join("")}</div>`:`<div class="city-empty-state">
                            <div class="empty-icon"><i class="fa-solid fa-house"></i></div>
                            <h4>No rooms available yet</h4>
                            <p>Be the first to list a room in ${i.name}!</p>
                            <a href="/post-listing" class="btn btn-primary mt-md">Post a Listing</a>
                           </div>`}
                </div>
            </section>

            <!-- ── NEIGHBORHOODS ── -->
            <section class="city-section city-section-alt">
                <div class="container">
                    <div class="city-section-header">
                        <div>
                            <h2>Popular Neighborhoods in ${i.name}</h2>
                            <p>Find the area that fits your lifestyle and budget.</p>
                        </div>
                    </div>
                    ${n.length>0?`<div class="neighborhoods-grid">${n.map((b,y)=>ra(b,y)).join("")}</div>`:`<div class="city-empty-state">
                            <div class="empty-icon"><i class="fa-solid fa-map-location-dot"></i></div>
                            <h4>Neighborhood guides coming soon</h4>
                            <p>We're building detailed guides for ${i.name}.</p>
                           </div>`}
                </div>
            </section>

            <!-- ── ROOMMATES LOOKING ── -->
            <section class="city-section city-section-alt">
                <div class="container">
                    <div class="city-section-header">
                        <div>
                            <h2>Roommates Looking in ${i.name}</h2>
                            <p>Connect with people actively searching for a home right now.</p>
                        </div>
                        <a href="/search/roommates?city=${i.slug}" class="btn btn-outline btn-sm">
                            See All Profiles <i class="fa-solid fa-arrow-right"></i>
                        </a>
                    </div>
                    ${l.length>0?`<div class="roommates-grid">${l.slice(0,6).map(b=>na(b)).join("")}</div>`:`<div class="city-empty-state">
                            <div class="empty-icon"><i class="fa-solid fa-user-group"></i></div>
                            <h4>No roommate profiles yet</h4>
                            <p>Create a profile to find your perfect match in ${i.name}.</p>
                            <a href="/post-listing" class="btn btn-primary mt-md">Create Profile</a>
                           </div>`}
                </div>
            </section>

            <!-- ── LIVING GUIDE ── -->
            <section class="city-section">
                <div class="container">
                    <div class="living-guide-layout">
                        <div class="living-guide-main">
                            <h2>Living in ${i.name}: A Complete Guide</h2>
                            <div class="rich-text mt-lg">
                                ${i.description||`<p>Welcome to ${i.name}. We're building a comprehensive living guide for this city — check back soon for neighborhoods, transport, utilities, and tenant tips!</p>`}
                            </div>
                        </div>
                        <div class="living-guide-sidebar">
                            <div class="guide-card guide-card-safety">
                                <div class="guide-card-icon"><i class="fa-solid fa-shield-halved"></i></div>
                                <div>
                                    <h4>Safety First</h4>
                                    <p>Always view a room in person or via video call before sending any deposit. Use our secure messaging for all communication.</p>
                                </div>
                            </div>
                            <div class="guide-resources-card">
                                <h4>Local Resources</h4>
                                <ul class="guide-resource-list">
                                    <li>
                                        <a href="#">
                                            <span class="resource-icon transit"><i class="fa-solid fa-bus"></i></span>
                                            <span class="resource-label">Public Transit Guide</span>
                                            <i class="fa-solid fa-chevron-right resource-arrow"></i>
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#">
                                            <span class="resource-icon utilities"><i class="fa-solid fa-bolt"></i></span>
                                            <span class="resource-label">Utility Setup Tips</span>
                                            <i class="fa-solid fa-chevron-right resource-arrow"></i>
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#">
                                            <span class="resource-icon legal"><i class="fa-solid fa-file-contract"></i></span>
                                            <span class="resource-label">Tenant Rights Info</span>
                                            <i class="fa-solid fa-chevron-right resource-arrow"></i>
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- ── FAQ ── -->
            ${i.faq_items&&i.faq_items.length>0?`
            <section class="city-section city-section-alt faq-section">
                <div class="container faq-container">
                    <div class="city-section-header centered">
                        <h2>Frequently Asked Questions</h2>
                        <p>Common questions about renting and finding roommates in ${i.name}.</p>
                    </div>
                    <div class="faq-accordion">
                        ${i.faq_items.map((b,y)=>`
                            <div class="faq-item${y===0?" active":""}">
                                <button class="faq-trigger" aria-expanded="${y===0}" onclick="
                                    var item = this.closest('.faq-item');
                                    var wasActive = item.classList.contains('active');
                                    item.closest('.faq-accordion').querySelectorAll('.faq-item').forEach(function(el){ el.classList.remove('active'); el.querySelector('.faq-trigger').setAttribute('aria-expanded','false'); });
                                    if(!wasActive){ item.classList.add('active'); this.setAttribute('aria-expanded','true'); }
                                ">
                                    <span>${b.question}</span>
                                    <span class="faq-icon"><i class="fa-solid fa-plus"></i><i class="fa-solid fa-minus"></i></span>
                                </button>
                                <div class="faq-body">
                                    <p>${b.answer}</p>
                                </div>
                            </div>
                        `).join("")}
                    </div>
                </div>
                <script type="application/ld+json">
                {
                  "@context": "https://schema.org",
                  "@type": "FAQPage",
                  "mainEntity": [
                    ${i.faq_items.map(b=>`{
                      "@type": "Question",
                      "name": "${b.question.replace(/"/g,'\\"')}",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "${b.answer.replace(/"/g,'\\"')}"
                      }
                    }`).join(",")}
                  ]
                }
                <\/script>
            </section>
            `:""}

            <!-- ── NEARBY CITIES ── -->
            <section class="city-section nearby-section">
                <div class="container">
                    <div class="city-section-header">
                        <div>
                            <h2>Explore Nearby Cities</h2>
                            <p>Considering other areas? Discover more options close to ${i.name}.</p>
                        </div>
                    </div>
                    <div class="nearby-cities-grid">
                        ${la(i)}
                    </div>
                </div>
            </section>

        </div><!-- /.city-page -->
    `,ca(i),pa(i),setTimeout(()=>{const b=e.querySelector(".city-page");b&&b.addEventListener("click",g=>{const f=g.target.closest(".save-btn");if(f){g.preventDefault(),g.stopPropagation();const h=f.dataset.id,c=ee();if(!c){X("/auth/login");return}const m=u.users.findById(c.id);if(!m)return;m.saved_listings||(m.saved_listings=[]);const p=m.saved_listings.indexOf(h);p>-1?(m.saved_listings.splice(p,1),f.innerHTML='<i class="fa-regular fa-heart"></i>',f.classList.remove("active")):(m.saved_listings.push(h),f.innerHTML='<i class="fa-solid fa-heart"></i>',f.classList.add("active")),u.users.update(c.id,{saved_listings:m.saved_listings})}});const y=e.querySelector(".search-bar-btn");y&&y.addEventListener("click",()=>{const g=e.querySelector("#listing-type").value,f=g==="roommate"?"roommate_wanted":g;X(`/search/rooms?city=${i.slug}&type=${f}`)}),ce()},0)}catch(a){console.error("[City] Rendering failed:",a),e.innerHTML=`
            <div class="container py-xl text-center">
                <h2>Something went wrong</h2>
                <p>We hit an error loading this city page. Please try again.</p>
                <pre style="text-align:left;font-size:0.8rem;background:#f5f5f5;padding:12px;border-radius:8px;overflow:auto">${a.message}</pre>
                <a href="/" class="btn btn-outline mt-md">Back to Home</a>
            </div>
        `}}function oa(e){const t=ee();let a=!1;if(t){const o=u.users.findById(t.id);o&&o.saved_listings&&o.saved_listings.includes(e.listing_id)&&(a=!0)}const i=e.photos&&e.photos[0]?e.photos[0]:"https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&h=400&fit=crop",s=(e.room_type||e.category||"room").replace(/_/g," ").toUpperCase();return`
        <div class="listing-card">
            <a href="/listing/${e.listing_id}" class="listing-card-link">
                <div class="listing-img" style="background-image:url('${i}')">
                    <span class="listing-type-badge">${s}</span>
                    <button class="save-btn ${a?"active":""}" data-id="${e.listing_id}" aria-label="Save listing">
                        <i class="${a?"fa-solid":"fa-regular"} fa-heart"></i>
                    </button>
                    <span class="listing-price-badge">$${e.price}<em>/mo</em></span>
                </div>
                <div class="listing-card-body">
                    <h3>${e.title}</h3>
                </div>
            </a>
        </div>
    `}const Mt=[{bg:"linear-gradient(135deg,#1a1a1a,#333333)",text:"#fff"},{bg:"linear-gradient(135deg,#1a1a1a,#444444)",text:"#fff"},{bg:"linear-gradient(135deg,#1a1a1a,#444444)",text:"#fff"},{bg:"linear-gradient(135deg,#1a1a1a,#444444)",text:"#fff"},{bg:"linear-gradient(135deg,#1a1a1a,#444444)",text:"#fff"},{bg:"linear-gradient(135deg,#1a1a1a,#444444)",text:"#fff"},{bg:"linear-gradient(135deg,#1a1a1a,#444444)",text:"#fff"},{bg:"linear-gradient(135deg,#1a1a1a,#444444)",text:"#fff"}];function ra(e,t){return`
        <div class="neighborhood-card">
            <div class="neighborhood-card-header" style="background:${Mt[t%Mt.length].bg}">
                <h3>${e.name}</h3>
                <span class="nh-listing-badge">${e.listing_count} Listings</span>
            </div>
            <div class="neighborhood-card-body">
                <div class="nh-rent">
                    <span class="nh-rent-label">Avg. Rent</span>
                    <span class="nh-rent-value">$${e.avg_rent}<em>/mo</em></span>
                </div>
                <p class="nh-description">${e.description}</p>
                <a href="/cities/${e.slug}" class="nh-link">
                    Explore Guide <i class="fa-solid fa-arrow-right"></i>
                </a>
            </div>
        </div>
    `}function na(e){const t=e.user_details||{display_name:"Roommate",profile_photo:"https://i.pravatar.cc/150?u=unknown"};return`
        <div class="roommate-card">
            <div class="roommate-card-img" style="background-image:url('${t.profile_photo}')">
                <span class="roommate-budget">$${e.price}/mo</span>
            </div>
            <div class="roommate-card-body">
                <h3 class="roommate-name">${t.display_name} ${je(t)}</h3>
                <p class="roommate-title">${e.title}</p>
                <div class="roommate-tags">
                    ${(e.lifestyle_tags||[]).slice(0,3).map(a=>`<span class="roommate-tag">${a.replace("tag_","")}</span>`).join("")}
                </div>
                <div class="roommate-move-in">
                    <i class="fa-regular fa-calendar"></i> Moving: ${e.move_in_date}
                </div>
            </div>
        </div>
    `}function la(e){const a=u.getCollection("cities").filter(s=>s.city_id!==e.city_id).map(s=>({...s,distance:da(e.latitude,e.longitude,s.latitude,s.longitude)})).sort((s,o)=>s.distance-o.distance).slice(0,5),i=u.getCollection("listings");return a.map(s=>{const o=s.hero_image||sa,n=i.filter(l=>l.city===s.city_id&&l.status==="active").length;return`
            <a href="/cities/${s.slug}" class="nearby-city-card">
                <div class="nearby-city-img" style="background-image:url('${o}')">
                    <div class="nearby-city-overlay">
                        <h4>${s.name}</h4>
                        <span class="nearby-distance"><i class="fa-solid fa-location-dot"></i> ${Math.round(s.distance)} mi</span>
                    </div>
                </div>
                <div class="nearby-city-meta">
                    <span><i class="fa-solid fa-house"></i> ${n} listings</span>
                    <span><i class="fa-solid fa-tag"></i> $${s.avg_rent}/mo</span>
                </div>
            </a>
        `}).join("")}function da(e,t,a,i){const o=(a-e)*Math.PI/180,n=(i-t)*Math.PI/180,l=Math.sin(o/2)**2+Math.cos(e*Math.PI/180)*Math.cos(a*Math.PI/180)*Math.sin(n/2)**2;return 3958.8*2*Math.atan2(Math.sqrt(l),Math.sqrt(1-l))}function ca(e){const t={"@context":"https://schema.org","@type":"BreadcrumbList",itemListElement:[{"@type":"ListItem",position:1,name:"Home",item:window.location.origin+"/"},{"@type":"ListItem",position:2,name:"Cities",item:window.location.origin+"/cities"},{"@type":"ListItem",position:3,name:e.name,item:window.location.origin+`/cities/${e.slug}`}]};let a=document.getElementById("breadcrumb-schema");a||(a=document.createElement("script"),a.id="breadcrumb-schema",a.type="application/ld+json",document.head.appendChild(a)),a.textContent=JSON.stringify(t)}function pa(e){document.title=e.meta_title||`${e.name} Rooms for Rent | RoommateGroups`;const t=document.querySelector('meta[name="description"]');t&&t.setAttribute("content",e.meta_description||`Find the best rooms and roommates in ${e.name}.`),We("og:title",document.title),We("og:description",e.meta_description||""),We("og:image",e.hero_image||Vt),We("og:url",window.location.href)}function We(e,t){let a=document.querySelector(`meta[property="${e}"]`);a||(a=document.createElement("meta"),a.setAttribute("property",e),document.head.appendChild(a)),a.setAttribute("content",t)}function he(e){const t=ee();console.log("[ADMIN PAGE] Rendering admin page for user:",t?.email,"role:",t?.role);const a=window.location.pathname||"/admin";let i="overview";a==="/admin/listings"&&(i="listings"),a==="/admin/users"&&(i="users"),a==="/admin/reports"&&(i="reports"),a==="/admin/analytics"&&(i="analytics"),a==="/admin/cities"&&(i="cities"),a==="/admin/content"&&(i="content"),a==="/admin/verifications"&&(i="verifications"),a==="/admin/settings"&&(i="admin_settings"),a==="/admin/fb-groups"&&(i="fb_groups"),a==="/admin/queries"&&(i="queries"),console.log("[ADMIN PAGE] Current view:",i,"path:",a);const s=u.listings.find(m=>m.moderation_status==="pending").length+u.listings.find(m=>m.moderation_status==="flagged").length,o=u.reports.find(m=>m.status==="pending").length,n=u.users.find(m=>m.id_status==="pending").length,l=u.user_queries.find(m=>!m.is_read).length,d=[{id:"overview",icon:"fa-gauge-high",label:"Overview",href:"/admin",section:"Platform"},{id:"listings",icon:"fa-house-circle-check",label:"Listing Moderation",href:"/admin/listings",badge:s,section:"Moderation"},{id:"verifications",icon:"fa-id-card-clip",label:"ID Verifications",href:"/admin/verifications",badge:n,section:"Moderation"},{id:"reports",icon:"fa-flag",label:"Reports & Flags",href:"/admin/reports",badge:o,section:"Moderation"},{id:"users",icon:"fa-users",label:"User Management",href:"/admin/users",section:"Management"},{id:"cities",icon:"fa-map-location-dot",label:"City Management",href:"/admin/cities",section:"Management"},{id:"fb_groups",icon:"fa-thumbs-up",label:"FB Groups",href:"/admin/fb-groups",section:"Management"},{id:"queries",icon:"fa-envelope-open-text",label:"User Queries",href:"/admin/queries",badge:l,section:"Management"},{id:"analytics",icon:"fa-chart-line",label:"Analytics",href:"/admin/analytics",section:"Insights"},{id:"content",icon:"fa-newspaper",label:"Content / Blog",href:"/admin/content",section:"Insights"},{id:"admin_settings",icon:"fa-sliders",label:"Settings",href:"/admin/settings",section:"System"}],v={Platform:"fa-gauge-high",Moderation:"fa-shield-halved",Management:"fa-users-gear",Insights:"fa-chart-line",System:"fa-sliders"},y=[...new Set(d.map(m=>m.section))].map(m=>{const p=d.filter(A=>A.section===m),r=p.some(A=>A.id===i),w=v[m]||"fa-folder",S=p.map(A=>{const _=A.id===i,$=A.badge?'<span class="adm-nav-badge">'+A.badge+"</span>":"";return'<a href="'+A.href+'" class="adm-nav-link'+(_?" active":"")+'"><i class="fa-solid '+A.icon+'"></i><span>'+A.label+"</span>"+$+"</a>"}).join("");return'<div class="adm-accordion-group'+(r?" open":"")+'"><button class="adm-accordion-header"><i class="fa-solid '+w+' adm-accordion-icon"></i><span class="adm-accordion-title">'+m+'</span><i class="fa-solid fa-chevron-right adm-accordion-chevron"></i></button><div class="adm-accordion-body">'+S+"</div></div>"}).join(""),g=localStorage.getItem("adm_sidebar_collapsed")==="true";e.innerHTML=['<div class="admin-layout">','<div class="adm-sidebar-overlay" id="adm-sidebar-overlay"></div>','<aside class="admin-sidebar'+(g?" collapsed":"")+'" id="admin-sidebar">','<div class="adm-sidebar-brand">','<i class="fa-solid fa-shield-halved"></i>','<div><div class="adm-brand-name">RG Admin</div><div class="adm-brand-sub">Control Panel</div></div>','<button class="adm-collapse-btn" id="adm-collapse-btn" title="Toggle Sidebar"><i class="fa-solid fa-chevron-left"></i></button>',"</div>",'<nav class="adm-nav">'+y+"</nav>",'<div class="adm-sidebar-footer">','<img src="https://ui-avatars.com/api/?name='+encodeURIComponent(t.display_name)+'&background=6366f1&color=fff&size=40" class="adm-user-avatar">','<div style="flex:1;min-width:0;"><div class="adm-user-name">'+q(t.display_name)+'</div><div class="adm-user-role">Administrator</div></div>','<button id="admin-logout-btn" class="adm-logout-btn" title="Sign Out"><i class="fa-solid fa-arrow-right-from-bracket"></i></button>',"</div>","</aside>",'<div class="admin-main">','<div class="admin-topbar">','<button class="adm-mobile-toggle" id="adm-menu-toggle"><i class="fa-solid fa-bars"></i></button>','<h1 class="adm-page-title">'+(d.find(m=>m.id===i)?.label||"Admin")+"</h1>",'<div class="adm-topbar-right">','<span class="adm-topbar-time">'+new Date().toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})+"</span>",'<a href="/" target="_blank" class="adm-topbar-site-btn"><i class="fa-solid fa-house"></i> Go to Website</a>',"</div>","</div>",'<div class="admin-content" id="admin-content"></div>',"</div>","</div>"].join("");const f=e.querySelector("#admin-content");switch(i){case"overview":fa(f);break;case"listings":ga(f);break;case"users":va(f);break;case"reports":ba(f);break;case"analytics":ya(f);break;case"cities":xa(f);break;case"content":_a(f);break;case"verifications":ha(f);break;case"fb_groups":wa(f);break;case"admin_settings":Ne(f);break;case"queries":Sa(f);break;default:ka(f,d.find(m=>m.id===i)?.label||"Section");break}const h=e.querySelector("#admin-sidebar"),c=e.querySelector("#adm-sidebar-overlay");if(e.querySelector("#adm-menu-toggle")?.addEventListener("click",()=>{h.classList.toggle("mobile-open"),c.classList.toggle("visible")}),c?.addEventListener("click",()=>{h.classList.remove("mobile-open"),c.classList.remove("visible")}),e.querySelector("#adm-collapse-btn")?.addEventListener("click",()=>{const m=h.classList.toggle("collapsed");localStorage.setItem("adm_sidebar_collapsed",m?"true":"false");const p=e.querySelector("#adm-collapse-btn i");p&&(p.className="fa-solid "+(m?"fa-chevron-right":"fa-chevron-left"))}),g){const m=e.querySelector("#adm-collapse-btn i");m&&(m.className="fa-solid fa-chevron-right")}e.querySelectorAll(".adm-accordion-header").forEach(m=>{m.addEventListener("click",()=>{const p=m.closest(".adm-accordion-group"),r=p.classList.contains("open");e.querySelectorAll(".adm-accordion-group").forEach(w=>w.classList.remove("open")),r||p.classList.add("open")})}),e.querySelector("#admin-logout-btn")?.addEventListener("click",async()=>{await Ut(),X("/"),window.location.reload()})}function q(e){return String(e||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}function ua(e,t=800,a=600,i=.6){return new Promise(s=>{const o=new Image;o.src=e,o.onload=()=>{const n=document.createElement("canvas");let l=o.width,d=o.height;l>d?l>t&&(d*=t/l,l=t):d>a&&(l*=a/d,d=a),n.width=l,n.height=d,n.getContext("2d").drawImage(o,0,0,l,d),s(n.toDataURL("image/jpeg",i))}})}function ft(e){const t=Date.now()-new Date(e).getTime(),a=Math.floor(t/6e4);if(a<1)return"just now";if(a<60)return a+"m ago";const i=Math.floor(a/60);return i<24?i+"h ago":Math.floor(i/24)+"d ago"}function ma(e){return e>=70?'<span class="screen-badge screen-good"><i class="fa-solid fa-circle-check"></i> '+e+"</span>":e>=40?'<span class="screen-badge screen-warn"><i class="fa-solid fa-triangle-exclamation"></i> '+e+"</span>":'<span class="screen-badge screen-bad"><i class="fa-solid fa-circle-xmark"></i> '+e+"</span>"}function Z(e,t,a){u.admin_logs.create({admin_id:e,action:t,target:a})}function P(e,t="success"){const a=document.getElementById("adm-toast");a&&a.remove();const i=document.createElement("div");i.id="adm-toast",i.className="adm-toast adm-toast-"+t,i.innerHTML='<i class="fa-solid '+(t==="error"?"fa-circle-exclamation":"fa-circle-check")+'"></i> '+e,document.body.appendChild(i),setTimeout(()=>i.classList.add("visible"),10),setTimeout(()=>{i.classList.remove("visible"),setTimeout(()=>i.remove(),300)},3e3)}function Te(e,t="#1a1a1a",a=300,i=80){const s=Math.max(...e,1),o=e.map((l,d)=>{const v=d/(e.length-1)*a,b=i-l/s*i;return v+","+b}).join(" "),n=e.map((l,d)=>{const v=d/(e.length-1)*a,b=i-l/s*i;return v+","+b}).join(" ")+" "+a+","+i+" 0,"+i;return'<svg viewBox="0 0 '+a+" "+i+'" preserveAspectRatio="none" style="width:100%;height:'+i+'px"><defs><linearGradient id="lg_'+t.replace("#","")+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="'+t+'" stop-opacity="0.3"/><stop offset="100%" stop-color="'+t+'" stop-opacity="0"/></linearGradient></defs><polygon points="'+n+'" fill="url(#lg_'+t.replace("#","")+')"/><polyline points="'+o+'" fill="none" stroke="'+t+'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'}function Jt(e,t="#1a1a1a",a=300,i=80){const s=Math.max(...e,1),o=a/e.length,n=e.map((l,d)=>{const v=l/s*i,b=d*o+o*.1,y=i-v;return'<rect x="'+b+'" y="'+y+'" width="'+o*.8+'" height="'+v+'" rx="2" fill="'+t+'" opacity="0.85"/>'}).join("");return'<svg viewBox="0 0 '+a+" "+i+'" preserveAspectRatio="none" style="width:100%;height:'+i+'px">'+n+"</svg>"}function fa(e){const t=u.users.findAll(),a=u.listings.findAll(),i=a.filter(_=>_.status==="active"),s=a.filter(_=>_.moderation_status==="pending"||_.moderation_status==="flagged"),o=u.reports.find(_=>_.status==="pending").length,n=u.users.find(_=>_.id_status==="pending").length,l=u.admin_logs.findAll().sort((_,$)=>new Date($.created_at)-new Date(_.created_at)).slice(0,10),d=u.user_queries.findAll().sort((_,$)=>new Date($.created_at)-new Date(_.created_at)).slice(0,5),v=u.user_queries.find(_=>!_.is_read).length,b={free:0,premium:29,pro:49,admin:0},y=t.reduce((_,$)=>_+(b[$.subscription_tier]||0),0),g=u.messages.find(_=>new Date(_.created_at)>new Date(Date.now()-864e5)).length,f=Array(30).fill(0),h=Array(30).fill(0).map((_,$)=>$===29?t.length:0),c=Array(30).fill(0).map((_,$)=>$===29?i.length:0),m=Array(30).fill(0).map((_,$)=>$===29?y:0),r=[{label:"Total Users",value:t.length,icon:"fa-users",bg:"#ede9fe",fg:"#6d28d9",chart:Te(h,"#7c3aed")},{label:"Active Listings",value:i.length,icon:"fa-house",bg:"#d1fae5",fg:"#065f46",chart:Te(c,"#059669")},{label:"MRR",value:"$"+y.toLocaleString(),icon:"fa-dollar-sign",bg:"#fef3c7",fg:"#92400e",chart:Te(m,"#d97706")},{label:"Messages Today",value:g,icon:"fa-comment-dots",bg:"#dbeafe",fg:"#1e40af",chart:Te(f.map((_,$)=>$===29?g:0),"#3b82f6")}].map(_=>['<div class="adm-kpi-card">','<div class="adm-kpi-top">','<div class="adm-kpi-icon" style="background:'+_.bg+";color:"+_.fg+'"><i class="fa-solid '+_.icon+'"></i></div>','<div><div class="adm-kpi-value">'+_.value+'</div><div class="adm-kpi-label">'+_.label+"</div></div>","</div>",'<div class="adm-kpi-trend"><span class="trend-up"><i class="fa-solid fa-arrow-trend-up"></i> Live data</span></div>','<div class="adm-kpi-chart">'+_.chart+"</div>","</div>"].join("")).join(""),S=[{href:"/admin/listings",icon:"fa-clock",bg:"#fef3c7",fg:"#b45309",label:"Pending Review",count:s.length+" listings"},{href:"/admin/reports",icon:"fa-flag",bg:"#fee2e2",fg:"#b91c1c",label:"Open Reports",count:o+" reports"},{href:"/admin/verifications",icon:"fa-id-card",bg:"#ede9fe",fg:"#6d28d9",label:"ID Verifications",count:n+" pending"},{href:"/admin/users",icon:"fa-users",bg:"#dbeafe",fg:"#1e40af",label:"Total Members",count:t.length+" users"}].map(_=>['<a href="'+_.href+'" class="adm-quick-action-card">','<div class="adm-qa-icon" style="background:'+_.bg+";color:"+_.fg+'"><i class="fa-solid '+_.icon+'"></i></div>','<div><div class="adm-qa-label">'+_.label+'</div><div class="adm-qa-count">'+_.count+"</div></div>","</a>"].join("")).join(""),A=l.length===0?'<div class="adm-empty" style="padding:30px"><i class="fa-solid fa-inbox"></i><p>No recent activity.</p></div>':l.map(_=>['<div class="adm-log-item">','<div class="adm-log-icon"><i class="fa-solid fa-clock-rotate-left"></i></div>','<div class="adm-log-body"><div class="adm-log-action">'+q(_.action)+'</div><div class="adm-log-target">'+q(_.target)+"</div></div>",'<div class="adm-log-time">'+ft(_.created_at)+"</div>","</div>"].join("")).join("");e.innerHTML=[s.length>0?['<div class="adm-alert adm-alert-warning">','<i class="fa-solid fa-triangle-exclamation"></i>',"<span><strong>"+s.length+" listing"+(s.length!==1?"s":"")+"</strong> awaiting moderation review.</span>",'<a href="/admin/listings" class="adm-alert-btn">Review Now</a>',"</div>"].join(""):"",v>0?['<div class="adm-alert" style="background:#eff6ff;border-left:4px solid #3b82f6;color:#1e40af;">','<i class="fa-solid fa-envelope-open-text"></i>',"<span><strong>"+v+" new user quer"+(v===1?"y":"ies")+"</strong> awaiting your response.</span>",'<a href="/admin/queries" class="adm-alert-btn" style="background:#3b82f6;color:white;">View Queries</a>',"</div>"].join(""):"",'<div class="adm-quick-actions">'+S+"</div>",'<div class="adm-kpi-grid">'+r+"</div>",'<div class="adm-charts-row">','<div class="adm-panel">','<div class="adm-panel-header"><h3><i class="fa-solid fa-users" style="color:#7c3aed;margin-right:6px"></i>New Users (30 days)</h3></div>','<div class="adm-chart-box">'+Te(h,"#7c3aed",600,120)+"</div>",'<div class="adm-chart-labels">'+["Week 1","Week 2","Week 3","Week 4","This Week"].map(_=>"<span>"+_+"</span>").join("")+"</div>","</div>",'<div class="adm-panel">','<div class="adm-panel-header"><h3><i class="fa-solid fa-house" style="color:#059669;margin-right:6px"></i>Listings Per Day (14 days)</h3></div>','<div class="adm-chart-box">'+Jt(c.slice(-14),"#059669",600,120)+"</div>","</div>","</div>",'<div class="adm-charts-row">','<div class="adm-panel">','<div class="adm-panel-header"><h3><i class="fa-solid fa-dollar-sign" style="color:#d97706;margin-right:6px"></i>Revenue Trend (MRR)</h3></div>','<div class="adm-chart-box">'+Te(m,"#d97706",600,120)+"</div>","</div>",'<div class="adm-panel">','<div class="adm-panel-header"><h3><i class="fa-solid fa-clock-rotate-left" style="color:#6366f1;margin-right:6px"></i>Recent Admin Activity</h3></div>','<div class="adm-log-list">'+A+"</div>","</div>","</div>",'<div class="adm-panel" style="margin-bottom:24px;">','<div class="adm-panel-header" style="display:flex;align-items:center;justify-content:space-between;">','<h3><i class="fa-solid fa-envelope-open-text" style="color:#3b82f6;margin-right:6px"></i>Recent User Queries</h3>','<a href="/admin/queries" style="font-size:0.85rem;color:#3b82f6;font-weight:600;text-decoration:none;">View All →</a>',"</div>",d.length===0?'<div class="adm-empty" style="padding:24px"><i class="fa-solid fa-inbox"></i><p>No queries yet.</p></div>':'<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:0.875rem;"><thead><tr style="background:#f8fafc;"><th style="padding:9px 14px;text-align:left;font-size:0.75rem;font-weight:700;color:#64748b;text-transform:uppercase;">Name</th><th style="padding:9px 14px;text-align:left;font-size:0.75rem;font-weight:700;color:#64748b;text-transform:uppercase;">Topic</th><th style="padding:9px 14px;text-align:left;font-size:0.75rem;font-weight:700;color:#64748b;text-transform:uppercase;">Date</th><th style="padding:9px 14px;text-align:left;font-size:0.75rem;font-weight:700;color:#64748b;text-transform:uppercase;">Status</th></tr></thead><tbody>'+d.map(_=>{const $=_.status==="replied"?'<span style="background:#d1fae5;color:#065f46;padding:2px 8px;border-radius:12px;font-size:0.75rem;font-weight:700;">Replied</span>':_.is_read?'<span style="background:#f1f5f9;color:#475569;padding:2px 8px;border-radius:12px;font-size:0.75rem;font-weight:700;">Read</span>':'<span style="background:#fee2e2;color:#991b1b;padding:2px 8px;border-radius:12px;font-size:0.75rem;font-weight:700;">New</span>',T=new Date(_.created_at).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});return'<tr style="border-top:1px solid #f1f5f9;'+(!_.is_read&&_.status!=="replied"?"background:#fffbeb;":"")+'"><td style="padding:10px 14px;font-weight:600;color:#1e293b;">'+q(_.first_name+" "+_.last_name)+'</td><td style="padding:10px 14px;color:#64748b;">'+q(_.topic_label||_.topic)+'</td><td style="padding:10px 14px;color:#64748b;font-size:0.85rem;">'+T+'</td><td style="padding:10px 14px;">'+$+"</td></tr>"}).join("")+"</tbody></table></div>","</div>"].join("")}function ga(e){let t="pending",a=new Set,i="",s="";function o(){const v={pending:b=>b.moderation_status==="pending",flagged:b=>b.moderation_status==="flagged",reported:b=>u.reports.find(y=>y.target_id===b.listing_id&&y.status==="pending").length>0,approved:b=>b.moderation_status==="approved",rejected:b=>b.moderation_status==="rejected"};return u.listings.find(b=>{const y=v[t]?v[t](b):!0,g=!i||b.city===i,f=!s||b.category===s;return y&&g&&f}).sort((b,y)=>new Date(y.created_at)-new Date(b.created_at))}function n(v){const b={pending:"pending",flagged:"flagged",approved:"approved",rejected:"rejected"};return v==="reported"?u.reports.find(y=>y.status==="pending").length:u.listings.find(y=>y.moderation_status===b[v]).length}function l(v,b,y=""){const g=ee();b==="approve"?(u.listings.update(v,{moderation_status:"approved"}),Z(g.user_id,"Approved listing",v),P("Listing approved.")):b==="reject"?(u.listings.update(v,{moderation_status:"rejected",rejection_reason:y}),Z(g.user_id,"Rejected listing",v),P("Listing rejected.","error")):b==="flag"&&(u.listings.update(v,{moderation_status:"flagged"}),Z(g.user_id,"Flagged listing for senior review",v),P("Listing flagged for senior review.","warning")),d()}function d(){const v=o(),b=u.cities.findAll(),g=["pending","flagged","reported","approved","rejected"].map(c=>{const m=n(c);return'<button class="adm-tab'+(c===t?" active":"")+'" data-tab="'+c+'">'+c.charAt(0).toUpperCase()+c.slice(1)+(m>0?' <span class="adm-tab-count">'+m+"</span>":"")+"</button>"}).join(""),f=['<div class="adm-filters">','<select class="adm-select" id="adm-city-filter">','<option value="">All Cities</option>',b.map(c=>'<option value="'+c.city_id+'"'+(i===c.city_id?" selected":"")+">"+c.name+"</option>").join(""),"</select>",'<select class="adm-select" id="adm-cat-filter">','<option value="">All Categories</option>',["room","apartment","sublet","roommate_wanted"].map(c=>'<option value="'+c+'"'+(s===c?" selected":"")+">"+c+"</option>").join(""),"</select>",a.size>0?['<button class="btn btn-sm btn-success" id="adm-bulk-approve"><i class="fa-solid fa-check"></i> Approve ('+a.size+")</button>",'<button class="btn btn-sm btn-danger" id="adm-bulk-reject"><i class="fa-solid fa-xmark"></i> Reject ('+a.size+")</button>"].join(""):"","</div>"].join(""),h=v.length===0?'<div class="adm-empty"><i class="fa-solid fa-inbox"></i><p>No listings in this category.</p></div>':v.map(c=>{const m=u.cities.findById(c.city),p=u.users.findById(c.user_id),r=a.has(c.listing_id),w=u.reports.find(A=>A.target_id===c.listing_id&&A.status==="pending").length,S=c.photos&&c.photos[0]?c.photos[0]:"https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=120&h=90&fit=crop";return['<div class="adm-listing-row'+(r?" selected":"")+'" data-id="'+c.listing_id+'">','<input type="checkbox" class="adm-row-check"'+(r?" checked":"")+' data-id="'+c.listing_id+'">','<img src="'+S+'" class="adm-listing-thumb" alt="">','<div class="adm-listing-info">','<div class="adm-listing-title">'+q(c.title)+"</div>",'<div class="adm-listing-meta">','<span><i class="fa-solid fa-user"></i> '+(p?q(p.display_name):"Unknown")+"</span>",'<span><i class="fa-solid fa-location-dot"></i> '+(m?m.name:"N/A")+"</span>",'<span><i class="fa-solid fa-tag"></i> $'+c.price+"/mo</span>",'<span><i class="fa-solid fa-clock"></i> '+ft(c.created_at)+"</span>",w>0?'<span class="adm-report-badge"><i class="fa-solid fa-flag"></i> '+w+" report"+(w>1?"s":"")+"</span>":"","</div>","</div>",'<div class="adm-screen-col">'+ma(c.auto_screen_score||0)+"</div>",'<div class="adm-row-actions">',c.moderation_status!=="approved"?'<button class="adm-btn adm-btn-approve" data-action="approve" data-id="'+c.listing_id+'"><i class="fa-solid fa-check"></i> Approve</button>':"",c.moderation_status!=="rejected"?'<button class="adm-btn adm-btn-reject" data-action="reject" data-id="'+c.listing_id+'"><i class="fa-solid fa-xmark"></i> Reject</button>':"",c.moderation_status!=="flagged"?'<button class="adm-btn adm-btn-flag" data-action="flag" data-id="'+c.listing_id+'"><i class="fa-solid fa-flag"></i> Flag</button>':"","</div>","</div>"].join("")}).join("");e.innerHTML=['<div class="adm-section-header"><h2>Listing Moderation</h2></div>','<div class="adm-tabs">'+g+"</div>",f,'<div class="adm-listing-queue">'+h+"</div>"].join(""),e.querySelectorAll(".adm-tab").forEach(c=>{c.addEventListener("click",()=>{t=c.dataset.tab,a.clear(),d()})}),e.querySelectorAll(".adm-row-check").forEach(c=>{c.addEventListener("change",()=>{const m=c.dataset.id;c.checked?a.add(m):a.delete(m),d()})}),e.querySelectorAll("[data-action]").forEach(c=>{c.addEventListener("click",()=>{const m=c.dataset.action==="reject"?prompt("Rejection reason (optional):")||"Violates guidelines":"";l(c.dataset.id,c.dataset.action,m)})}),e.querySelector("#adm-city-filter")?.addEventListener("change",c=>{i=c.target.value,d()}),e.querySelector("#adm-cat-filter")?.addEventListener("change",c=>{s=c.target.value,d()}),e.querySelector("#adm-bulk-approve")?.addEventListener("click",()=>{a.forEach(c=>l(c,"approve")),a.clear()}),e.querySelector("#adm-bulk-reject")?.addEventListener("click",()=>{a.forEach(c=>l(c,"reject","Bulk rejected")),a.clear()})}d()}function va(e){let t="",a="",i="",s="",o="",n=null;function l(){return u.users.findAll().filter(y=>{const g=!t||y.display_name.toLowerCase().includes(t.toLowerCase())||y.email.toLowerCase().includes(t.toLowerCase()),f=!a||(a==="active"?y.is_active:!y.is_active),h=!i||y.subscription_tier===i,c=!s||y.country===s,m=!o||y.city===o;return g&&f&&h&&c&&m}).sort((y,g)=>new Date(g.created_at)-new Date(y.created_at))}function d(y,g){const f=ee(),h=u.users.findById(y);if(h){if(h.role==="admin"&&h.user_id===f?.user_id&&(g==="suspend"||g==="block"||g==="delete")){P("You cannot perform this action on your own admin account.","error");return}if(g==="suspend")u.users.update(y,{is_active:!1}),Z(f.user_id,"Suspended user",h.display_name),P("User suspended.");else if(g==="activate")u.users.update(y,{is_active:!0,is_blocked:!1}),Z(f.user_id,"Reactivated user",h.display_name),P("User reactivated.");else if(g==="block")u.users.update(y,{is_active:!1,is_blocked:!0}),Z(f.user_id,"Blocked user",h.display_name),P("User blocked. They cannot log in or access the platform.","error");else if(g==="unblock")u.users.update(y,{is_active:!0,is_blocked:!1}),Z(f.user_id,"Unblocked user",h.display_name),P("User unblocked.");else if(g==="make_admin")u.users.update(y,{role:"admin"}),Z(f.user_id,"Granted admin role",h.display_name),P("Admin role granted.");else if(g==="remove_admin")u.users.update(y,{role:"user"}),Z(f.user_id,"Removed admin role",h.display_name),P("Admin role removed.");else if(g==="delete"){if(!confirm('Permanently delete "'+h.display_name+'"? This will also remove all their listings, messages, and threads. This cannot be undone.'))return;u.listings.find(m=>m.user_id===y).forEach(m=>u.listings.delete(m.listing_id)),new Set(u.threads.find(m=>m.participants&&m.participants.includes(y)).map(m=>m.thread_id)).forEach(m=>{u.messages.find(p=>p.thread_id===m).forEach(p=>u.messages.delete(p.message_id)),u.threads.delete(m)}),u.reports.find(m=>m.reporter_id===y||m.target_id===y).forEach(m=>u.reports.delete(m.report_id)),u.users.delete(y),Z(f.user_id,"Deleted user account",h.display_name),P('User "'+h.display_name+'" permanently deleted.',"error")}n=null,v()}}function v(){const y=l(),g=u.countries.findAll().sort((r,w)=>r.name.localeCompare(w.name)),f=s?u.cities.find(r=>r.country===s&&r.is_active!==!1).sort((r,w)=>r.name.localeCompare(w.name)):u.cities.findAll().sort((r,w)=>r.name.localeCompare(w.name)),h=['<div class="adm-filters">','<div class="adm-search-wrap"><i class="fa-solid fa-magnifying-glass"></i><input type="text" id="adm-user-search" class="adm-search-input" placeholder="Search by name or email..." value="'+q(t)+'"></div>','<select class="adm-select" id="adm-status-filter">','<option value="">All Status</option>','<option value="active"'+(a==="active"?" selected":"")+">Active</option>",'<option value="inactive"'+(a==="inactive"?" selected":"")+">Suspended</option>","</select>",'<select class="adm-select" id="adm-tier-filter">','<option value="">All Tiers</option>',["free","basic","premium","pro"].map(r=>'<option value="'+r+'"'+(i===r?" selected":"")+">"+r.charAt(0).toUpperCase()+r.slice(1)+"</option>").join(""),"</select>",'<select class="adm-select" id="adm-country-filter">','<option value="">All Countries</option>',g.map(r=>'<option value="'+r.country_id+'"'+(s===r.country_id?" selected":"")+">"+(r.flag_emoji?r.flag_emoji+" ":"")+r.name+"</option>").join(""),"</select>",'<select class="adm-select" id="adm-city-filter">','<option value="">All Cities</option>',f.map(r=>'<option value="'+r.city_id+'"'+(o===r.city_id?" selected":"")+">"+q(r.name)+"</option>").join(""),"</select>","</div>"].join(""),c={basic:"🔵",phone:"📱",id:"🟢",community:"⭐"},m={free:"#94a3b8",basic:"#333333",premium:"#1a1a1a",pro:"#555555"},p=y.map(r=>{const w=u.cities.findById(r.city)||u.cities.findOne(E=>E.name===r.city),S=r.country?u.countries.findById(r.country):w?u.countries.findById(w.country):null,A=u.listings.find(E=>E.user_id===r.user_id).length,_=r.profile_photo||"https://ui-avatars.com/api/?name="+encodeURIComponent(r.display_name)+"&background=6366f1&color=fff&size=40",$=n===r.user_id;return['<tr class="adm-user-row">','<td><div class="adm-user-cell"><img src="'+_+'" class="adm-user-sm-avatar"><div><div class="adm-user-nm">'+q(r.display_name)+'</div><div class="adm-user-em">'+q(r.email)+"</div></div></div></td>","<td>"+(S?(S.flag_emoji?S.flag_emoji+" ":"")+q(S.name):"—")+"</td>","<td>"+(w?q(w.name):r.city||"—")+"</td>","<td>"+new Date(r.created_at).toLocaleDateString()+"</td>",'<td><span style="color:'+(m[r.subscription_tier]||"#94a3b8")+';font-weight:600">'+(r.subscription_tier||"free")+"</span></td>","<td>"+(c[r.verification_level]||"⚪")+" "+(r.verification_level||"basic")+"</td>","<td>"+A+"</td>",'<td><span class="adm-status-pill '+(r.is_blocked?"pill-rejected":r.is_active?"pill-active":"pill-inactive")+'"><i class="fa-solid '+(r.is_blocked?"fa-ban":r.is_active?"fa-circle-check":"fa-circle-xmark")+'" style="font-size:0.65rem"></i> '+(r.is_blocked?"Blocked":r.is_active?"Active":"Suspended")+"</span></td>",'<td><div style="position:relative">','<button class="adm-action-toggle" data-uid="'+r.user_id+'"><i class="fa-solid fa-ellipsis-vertical"></i></button>',$?['<div class="adm-user-dropdown">',r.is_blocked?'<div class="adm-dd-item" data-uid="'+r.user_id+'" data-action="unblock"><i class="fa-solid fa-lock-open"></i> Unblock</div>':r.is_active?'<div class="adm-dd-item" data-uid="'+r.user_id+'" data-action="suspend"><i class="fa-solid fa-user-slash"></i> Suspend</div>':'<div class="adm-dd-item" data-uid="'+r.user_id+'" data-action="activate"><i class="fa-solid fa-user-check"></i> Reactivate</div>',r.is_blocked?"":'<div class="adm-dd-item adm-dd-item-warn" data-uid="'+r.user_id+'" data-action="block"><i class="fa-solid fa-ban"></i> Block User</div>',r.role!=="admin"?'<div class="adm-dd-item" data-uid="'+r.user_id+'" data-action="make_admin"><i class="fa-solid fa-shield-halved"></i> Make Admin</div>':"",r.role==="admin"?'<div class="adm-dd-item" data-uid="'+r.user_id+'" data-action="remove_admin"><i class="fa-solid fa-shield"></i> Remove Admin</div>':"",'<div class="adm-dd-divider"></div>','<div class="adm-dd-item adm-dd-item-danger" data-uid="'+r.user_id+'" data-action="delete"><i class="fa-solid fa-trash"></i> Delete User</div>',"</div>"].join(""):"","</div></td>","</tr>"].join("")}).join("");e.innerHTML=['<div class="adm-section-header"><h2>User Management</h2><span class="adm-count-badge">'+y.length+' users</span><button class="btn btn-primary btn-sm" id="adm-send-notif-btn" style="margin-left:auto;display:inline-flex;align-items:center;gap:6px;"><i class="fa-solid fa-bell"></i> Send Notification</button></div>',h,'<div class="adm-table-wrap">','<table class="adm-table">',"<thead><tr><th>User</th><th>Country</th><th>City</th><th>Joined</th><th>Tier</th><th>Verification</th><th>Listings</th><th>Status</th><th>Actions</th></tr></thead>","<tbody>"+p+"</tbody>","</table>","</div>"].join(""),e.querySelector("#adm-user-search")?.addEventListener("input",r=>{t=r.target.value,v()}),e.querySelector("#adm-status-filter")?.addEventListener("change",r=>{a=r.target.value,v()}),e.querySelector("#adm-tier-filter")?.addEventListener("change",r=>{i=r.target.value,v()}),e.querySelector("#adm-country-filter")?.addEventListener("change",r=>{s=r.target.value,o="",v()}),e.querySelector("#adm-city-filter")?.addEventListener("change",r=>{o=r.target.value,v()}),e.querySelectorAll(".adm-action-toggle").forEach(r=>{r.addEventListener("click",w=>{w.stopPropagation(),n=n===r.dataset.uid?null:r.dataset.uid,v()})}),document.addEventListener("click",()=>{n&&(n=null,v())},{once:!0}),e.querySelectorAll("[data-uid][data-action]").forEach(r=>{r.addEventListener("click",w=>{w.stopPropagation(),d(r.dataset.uid,r.dataset.action)})}),e.querySelector("#adm-send-notif-btn")?.addEventListener("click",b)}function b(){const y=document.getElementById("adm-notif-modal");y&&y.remove();const g=u.countries.findAll().filter($=>$.is_active).sort(($,E)=>$.name.localeCompare(E.name)),f=u.users.findAll().filter($=>$.role!=="admin"),h=document.createElement("div");h.id="adm-notif-modal",h.className="adm-notif-overlay",h.style.cssText="position:fixed;inset:0;background:rgba(15,23,42,0.45);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:99999;padding:16px;",h.innerHTML=`
        <div style="background:#fff;border-radius:16px;width:100%;max-width:560px;max-height:90vh;display:flex;flex-direction:column;box-shadow:0 24px 64px rgba(0,0,0,0.2);overflow:hidden;">
          <div style="display:flex;align-items:center;justify-content:space-between;padding:20px 24px;border-bottom:1px solid #e2e8f0;">
            <h3 style="margin:0;font-size:1.05rem;font-weight:700;display:flex;align-items:center;gap:8px;"><i class="fa-solid fa-bell" style="color:var(--primary);"></i> Send Notification</h3>
            <button id="adm-notif-close" style="background:none;border:none;cursor:pointer;width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#64748b;font-size:1rem;"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div style="display:flex;flex-direction:column;gap:16px;padding:20px 24px;overflow-y:auto;flex:1;">

            <div class="form-group">
              <label style="font-weight:600;font-size:0.85rem;">Target Audience</label>
              <select class="form-control" id="notif-target-type">
                <option value="all">All Users</option>
                <option value="country">By Country</option>
                <option value="city">By City</option>
                <option value="manual">Manual Selection</option>
              </select>
            </div>

            <div class="form-group" id="notif-country-wrap" style="display:none;">
              <label style="font-weight:600;font-size:0.85rem;">Select Country</label>
              <select class="form-control" id="notif-country">
                <option value="">Select a country</option>
                ${g.map($=>`<option value="${$.country_id}">${$.flag_emoji?$.flag_emoji+" ":""}${q($.name)}</option>`).join("")}
              </select>
            </div>

            <div class="form-group" id="notif-city-wrap" style="display:none;">
              <label style="font-weight:600;font-size:0.85rem;">Select City</label>
              <select class="form-control" id="notif-city">
                <option value="">Select a city</option>
              </select>
            </div>

            <div class="form-group" id="notif-manual-wrap" style="display:none;">
              <label style="font-weight:600;font-size:0.85rem;">Select Users</label>
              <div id="notif-user-list" style="max-height:180px;overflow-y:auto;border:1px solid var(--border);border-radius:8px;padding:8px;display:flex;flex-direction:column;gap:6px;">
                ${f.map($=>`
                  <label style="display:flex;align-items:center;gap:8px;cursor:pointer;padding:4px 2px;font-size:0.85rem;">
                    <input type="checkbox" class="notif-user-cb" value="${$.user_id}" style="width:15px;height:15px;">
                    <img src="${$.profile_photo||`https://ui-avatars.com/api/?name=${encodeURIComponent($.display_name)}&background=6366f1&color=fff&size=32`}" style="width:26px;height:26px;border-radius:50%;object-fit:cover;">
                    <span>${q($.display_name)}</span>
                    <span style="color:var(--text-secondary);font-size:0.75rem;">${q($.email)}</span>
                  </label>`).join("")}
              </div>
            </div>

            <div class="form-group">
              <label style="font-weight:600;font-size:0.85rem;">Title <span style="color:#e53e3e">*</span></label>
              <input type="text" class="form-control" id="notif-title" placeholder="Notification title" maxlength="100">
            </div>

            <div class="form-group">
              <label style="font-weight:600;font-size:0.85rem;">Description <span style="color:#e53e3e">*</span></label>
              <textarea class="form-control" id="notif-desc" rows="3" placeholder="Write your message..." maxlength="500"></textarea>
            </div>

            <div class="form-group">
              <label style="font-weight:600;font-size:0.85rem;">Image <span style="color:var(--text-secondary);font-weight:400;">(optional)</span></label>
              <div id="notif-img-preview" style="display:none;margin-bottom:8px;"><img id="notif-img-thumb" src="" style="max-height:120px;border-radius:8px;border:1px solid var(--border);"></div>
              <label class="btn btn-outline btn-sm" for="notif-img-input" style="cursor:pointer;display:inline-flex;align-items:center;gap:6px;"><i class="fa-solid fa-image"></i> Upload Image<input type="file" id="notif-img-input" accept="image/*" style="display:none;"></label>
            </div>

            <div class="form-group">
              <label style="font-weight:600;font-size:0.85rem;">Website URL <span style="color:var(--text-secondary);font-weight:400;">(optional)</span></label>
              <input type="url" class="form-control" id="notif-url" placeholder="https://example.com">
            </div>

          </div>
          <div style="display:flex;justify-content:flex-end;gap:10px;padding:16px 24px;border-top:1px solid #e2e8f0;flex-shrink:0;">
            <button class="btn btn-outline" id="adm-notif-cancel">Cancel</button>
            <button class="btn btn-primary" id="adm-notif-submit"><i class="fa-solid fa-paper-plane"></i> Send</button>
          </div>
        </div>`,document.body.appendChild(h);const c=h.querySelector("#notif-target-type"),m=h.querySelector("#notif-country-wrap"),p=h.querySelector("#notif-city-wrap"),r=h.querySelector("#notif-manual-wrap"),w=h.querySelector("#notif-country"),S=h.querySelector("#notif-city");let A="";c.addEventListener("change",()=>{const $=c.value;m.style.display=$==="country"||$==="city"?"":"none",p.style.display=$==="city"?"":"none",r.style.display=$==="manual"?"":"none"}),w.addEventListener("change",()=>{const $=w.value;S.innerHTML='<option value="">Select a city</option>',$&&u.cities.find(E=>E.country===$&&E.is_active!==!1).sort((E,T)=>E.name.localeCompare(T.name)).forEach(E=>{const T=document.createElement("option");T.value=E.city_id,T.textContent=E.name,S.appendChild(T)})}),h.querySelector("#notif-img-input").addEventListener("change",$=>{const E=$.target.files[0];if(!E)return;const T=new FileReader;T.onload=j=>{A=j.target.result,h.querySelector("#notif-img-thumb").src=A,h.querySelector("#notif-img-preview").style.display=""},T.readAsDataURL(E)});function _(){h.remove()}h.querySelector("#adm-notif-close").addEventListener("click",_),h.querySelector("#adm-notif-cancel").addEventListener("click",_),h.addEventListener("click",$=>{$.target===h&&_()}),h.querySelector("#adm-notif-submit").addEventListener("click",()=>{const $=h.querySelector("#notif-title").value.trim(),E=h.querySelector("#notif-desc").value.trim(),T=h.querySelector("#notif-url").value.trim();if(!$){P("Title is required.","error");return}if(!E){P("Description is required.","error");return}const j=ee(),M=c.value;let R=[];if(M==="all")R=u.users.findAll().filter(F=>F.role!=="admin").map(F=>F.user_id);else if(M==="country"){const F=w.value;if(!F){P("Please select a country.","error");return}R=u.users.find(H=>H.country===F&&H.role!=="admin").map(H=>H.user_id)}else if(M==="city"){const F=S.value;if(!F){P("Please select a city.","error");return}R=u.users.find(H=>H.city===F&&H.role!=="admin").map(H=>H.user_id)}else if(M==="manual"&&(h.querySelectorAll(".notif-user-cb:checked").forEach(F=>R.push(F.value)),R.length===0)){P("Please select at least one user.","error");return}if(R.length===0){P("No users match the selected target.","error");return}R.forEach(F=>{u.notifications.create({user_id:F,sent_by:j.user_id,title:$,description:E,image_url:A||null,website_url:T||null,is_read:!1,created_at:new Date().toISOString()})}),Z(j.user_id,"Sent notification to "+R.length+" users",$),P("Notification sent to "+R.length+" user(s)!","success"),_()})}v()}function ha(e){let t="pending";function a(){return u.users.find(o=>t==="pending"?o.id_status==="pending":o.id_status!=="pending"&&o.id_status!==void 0).sort((o,n)=>new Date(n.created_at)-new Date(o.created_at))}function i(o,n,l=""){const d=ee(),v=u.users.findById(o);v&&(n==="approve"?(u.users.update(o,{id_status:"approved",id_verified:!0,verification_level:v.verification_level==="basic"||v.verification_level==="phone"?"id":v.verification_level}),Z(d.user_id,"Approved ID Verification",v.display_name),P("User ID verified successfully.")):n==="reject"&&(u.users.update(o,{id_status:"rejected",id_reject_reason:l,verification_id_photo:null,verification_selfie:null}),Z(d.user_id,"Rejected ID Verification: "+l,v.display_name),P("ID Verification rejected and removed.","error")),s())}function s(){const o=a(),n=['<button class="adm-tab'+(t==="pending"?" active":"")+'" data-mode="pending">Pending Queue '+(t==="pending"?'<span class="adm-tab-count">'+o.length+"</span>":"")+"</button>",'<button class="adm-tab'+(t==="history"?" active":"")+'" data-mode="history">History</button>'].join(""),l=o.length===0?`<div class="adm-empty"><i class="fa-solid fa-check-double" style="font-size:3rem;color:#333333;"></i><p>No ${t==="pending"?"pending":"historical"} ID verifications.</p></div>`:o.map(d=>{const v=d.updated_at?new Date(d.updated_at).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric",hour:"2-digit",minute:"2-digit"}):"Unknown",b=d.id_status==="pending"?'<span class="badge badge-warning"><i class="fas fa-clock"></i> Pending Review</span>':d.id_status==="approved"?'<span class="badge badge-success"><i class="fas fa-check"></i> Approved</span>':'<span class="badge badge-danger"><i class="fas fa-times"></i> Rejected</span>',y=d.profile_photo?`<img src="${q(d.profile_photo)}" style="width:44px;height:44px;border-radius:50%;object-fit:cover;border:2px solid #e2e8f0;">`:`<div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#1a1a1a,#555555);color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:1.1rem;">${(d.display_name||"?").charAt(0).toUpperCase()}</div>`,g={basic:"⚪",phone:"🔵",id:"🟣",community:"🌟"}[d.verification_level]||"⚪";return`
                <div class="adm-panel" style="border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
                    <div class="adm-panel-header" style="background:linear-gradient(135deg,#f8fafc,#f1f5f9);padding:18px 24px;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;justify-content:space-between;gap:16px;">
                        <div style="display:flex;align-items:center;gap:14px;">
                            ${y}
                            <div>
                                <div style="font-weight:700;font-size:1.05rem;">${q(d.display_name||"Unknown")} ${g}</div>
                                <div style="font-size:0.82rem;color:#64748b;">${q(d.email)} · Submitted ${v}</div>
                            </div>
                        </div>
                        <div style="display:flex;align-items:center;gap:10px;">
                            ${b}
                        </div>
                    </div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0;background:#f8fafc;">
                        <div style="padding:20px;border-right:1px solid #e2e8f0;text-align:center;">
                            <div style="font-weight:700;color:#475569;margin-bottom:12px;font-size:0.9rem;text-transform:uppercase;letter-spacing:0.05em;"><i class="fas fa-id-card" style="color:#1a1a1a;"></i> Government ID</div>
                            ${d.verification_id_photo?`<img src="${q(d.verification_id_photo)}" alt="ID Photo" style="max-width:100%;max-height:220px;object-fit:contain;border-radius:10px;border:1px solid #e2e8f0;cursor:pointer;" onclick="window.open(this.src,'_blank')" title="Click to open full size">`:'<div style="height:180px;background:#f1f5f9;border-radius:10px;display:flex;align-items:center;justify-content:center;color:#94a3b8;border:2px dashed #dddddd;"><i class="fas fa-image" style="font-size:3rem;"></i></div>'}
                        </div>
                        <div style="padding:20px;text-align:center;">
                            <div style="font-weight:700;color:#475569;margin-bottom:12px;font-size:0.9rem;text-transform:uppercase;letter-spacing:0.05em;"><i class="fas fa-camera" style="color:#1a1a1a;"></i> Live Selfie</div>
                            ${d.verification_selfie?`<img src="${q(d.verification_selfie)}" alt="Selfie" style="max-width:100%;max-height:220px;object-fit:contain;border-radius:10px;border:1px solid #e2e8f0;cursor:pointer;" onclick="window.open(this.src,'_blank')" title="Click to open full size">`:'<div style="height:180px;background:#f1f5f9;border-radius:10px;display:flex;align-items:center;justify-content:center;color:#94a3b8;border:2px dashed #dddddd;"><i class="fas fa-user-circle" style="font-size:3rem;"></i></div>'}
                        </div>
                    </div>
                    ${d.id_status==="pending"?`
                    <div style="padding:16px 24px;background:white;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
                        <button class="btn btn-outline btn-sm adm-btn-fraud" data-uid="${q(d.user_id)}" style="gap:6px;">
                            <i class="fa-solid fa-database"></i> Check Fraud DB
                        </button>
                        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
                            <select class="form-control adm-reject-reason" data-uid="${q(d.user_id)}" style="min-width:200px;">
                                <option value="">Select Rejection Reason...</option>
                                <option value="Blurry Photo">📷 Blurry Photo</option>
                                <option value="ID Mismatch">🔍 ID Mismatch</option>
                                <option value="Expired ID">📅 Expired ID</option>
                                <option value="Underage">🔞 Underage</option>
                                <option value="Suspected Fraud">🚨 Suspected Fraud</option>
                            </select>
                            <button class="adm-btn adm-btn-reject" data-action="reject" data-uid="${q(d.user_id)}" style="display:flex;align-items:center;gap:6px;">
                                <i class="fas fa-times"></i> Reject
                            </button>
                            <button class="adm-btn adm-btn-approve" data-action="approve" data-uid="${q(d.user_id)}" style="display:flex;align-items:center;gap:6px;">
                                <i class="fas fa-check"></i> Approve
                            </button>
                        </div>
                    </div>`:d.id_reject_reason?`<div style="padding:16px 24px;background:#f5f5f5;border-top:1px solid #dddddd;color:#1a1a1a;font-size:0.9rem;"><i class="fas fa-times-circle"></i> Rejected: ${q(d.id_reject_reason)}</div>`:'<div style="padding:16px 24px;background:#f5f5f5;border-top:1px solid #dddddd;color:#333333;font-size:0.9rem;"><i class="fas fa-check-circle"></i> Approved — User is now ID Verified</div>'}
                </div>`}).join("");e.innerHTML=['<div class="adm-section-header"><h2>ID Verifications</h2></div>','<div class="adm-tabs">'+n+"</div>",'<div class="adm-verif-list" style="display:grid;gap:20px;">'+l+"</div>"].join(""),e.querySelectorAll(".adm-tab").forEach(d=>d.addEventListener("click",()=>{t=d.dataset.mode,s()})),e.querySelectorAll("[data-action]").forEach(d=>{d.addEventListener("click",()=>{const v=d.dataset.uid,b=d.dataset.action;let y="";if(b==="reject"){const g=e.querySelector('.adm-reject-reason[data-uid="'+v+'"]');if(!g.value){alert("Please select a rejection reason.");return}y=g.value}i(v,b,y)})}),e.querySelectorAll(".adm-btn-fraud").forEach(d=>{d.addEventListener("click",()=>{const v=d.dataset.uid;d.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> Checking...',setTimeout(()=>{Math.random()>.8?i(v,"reject","Found in Fraud Database"):(d.innerHTML='<i class="fa-solid fa-check" style="color:#333333;"></i> Clean (Not in DB)',d.disabled=!0)},1e3)})})}s()}function ba(e){let t="pending";function a(){const o=u.reports.findAll(),n={};return o.forEach(l=>{n[l.target_id]=(n[l.target_id]||0)+1}),o.filter(l=>!t||l.status===t).map(l=>({...l,report_count:n[l.target_id]||1,priority:n[l.target_id]>=3?"high":n[l.target_id]>=2?"medium":"low"})).sort((l,d)=>{const v={high:0,medium:1,low:2};return v[l.priority]!==v[d.priority]?v[l.priority]-v[d.priority]:new Date(d.created_at)-new Date(l.created_at)})}function i(o,n){const l=ee(),d=u.reports.findById(o);d&&(n==="dismiss"?(u.reports.update(o,{status:"dismissed"}),Z(l.user_id,"Dismissed report",d.target_name),P("Report dismissed.")):n==="remove"?(u.listings.update(d.target_id,{status:"removed",moderation_status:"rejected"}),u.reports.update(o,{status:"resolved"}),Z(l.user_id,"Removed content",d.target_name),P("Content removed.","error")):n==="warn"&&(u.reports.update(o,{status:"warned"}),Z(l.user_id,"Issued warning",d.target_name),P("Warning issued to user.")),s())}function s(){const o=a(),l=["pending","dismissed","resolved","warned"].map(b=>{const y=u.reports.find(g=>g.status===b).length;return'<button class="adm-tab'+(b===t?" active":"")+'" data-tab="'+b+'">'+b.charAt(0).toUpperCase()+b.slice(1)+(y>0?' <span class="adm-tab-count">'+y+"</span>":"")+"</button>"}).join(""),d=b=>({high:'<span class="adm-priority high"><i class="fa-solid fa-fire"></i> High</span>',medium:'<span class="adm-priority medium"><i class="fa-solid fa-exclamation"></i> Medium</span>',low:'<span class="adm-priority low"><i class="fa-solid fa-minus"></i> Low</span>'})[b]||"",v=o.length===0?'<div class="adm-empty"><i class="fa-solid fa-flag"></i><p>No reports in this category.</p></div>':o.map(b=>['<div class="adm-report-card'+(b.priority==="high"?" escalated":"")+'">','<div class="adm-report-left">','<div class="adm-report-priority">'+d(b.priority)+(b.report_count>=3?'<span class="adm-escalated-tag">Auto-escalated</span>':"")+"</div>",'<div class="adm-report-type-badge '+b.type+'">'+(b.type==="listing"?'<i class="fa-solid fa-house"></i>':'<i class="fa-solid fa-user"></i>')+" "+b.type+"</div>","</div>",'<div class="adm-report-body">','<div class="adm-report-target">'+q(b.target_name)+"</div>",'<div class="adm-report-reason">"'+q(b.reason)+'" — reported by <strong>'+q(b.reporter_name)+"</strong></div>",'<div class="adm-report-meta">'+ft(b.created_at)+" · "+b.report_count+" total report(s)</div>","</div>",'<div class="adm-report-actions">',b.status==="pending"?['<button class="adm-btn adm-btn-sm" data-rid="'+b.report_id+'" data-raction="dismiss">Dismiss</button>','<button class="adm-btn adm-btn-sm adm-btn-warn" data-rid="'+b.report_id+'" data-raction="warn">Warn</button>',b.type==="listing"?'<button class="adm-btn adm-btn-sm adm-btn-reject" data-rid="'+b.report_id+'" data-raction="remove">Remove</button>':""].join(""):'<span class="adm-status-pill pill-inactive">'+b.status+"</span>","</div>","</div>"].join("")).join("");e.innerHTML=['<div class="adm-section-header"><h2>Reports & Flags</h2><span class="adm-count-badge">'+o.length+" shown</span></div>",'<div class="adm-tabs">'+l+"</div>",'<div class="adm-reports-list">'+v+"</div>"].join(""),e.querySelectorAll(".adm-tab").forEach(b=>{b.addEventListener("click",()=>{t=b.dataset.tab,s()})}),e.querySelectorAll("[data-raction]").forEach(b=>{b.addEventListener("click",()=>i(b.dataset.rid,b.dataset.raction))})}s()}function ya(e){const t=u.users.find(x=>x.role!=="admin"),a=u.listings.find(x=>x.status==="active"),i=u.threads.findAll(),s=u.messages.findAll(),o=oi(),n=t.length,l=a.length,d=i.length,v={};s.forEach(x=>{v[x.thread_id]=(v[x.thread_id]||0)+1});const b=Object.values(v).filter(x=>x>=2).length,y=Math.max(o,1),g=x=>o>0?+(x/y*100).toFixed(1):0,h=[{label:"Visitors",value:o,pct:100},{label:"Registered",value:n,pct:g(n)},{label:"Listed",value:l,pct:g(l)},{label:"Messaged",value:d,pct:g(d)},{label:"Converted",value:b,pct:g(b)}].map((x,O)=>['<div class="adm-funnel-step">','<div class="adm-funnel-bar" style="width:'+(100-O*15)+"%;opacity:"+(1-O*.15)+'">','<span class="adm-funnel-label">'+x.label+"</span>",'<span class="adm-funnel-value">'+x.value.toLocaleString()+"</span>","</div>",'<div class="adm-funnel-pct">'+x.pct+"%</div>","</div>"].join("")).join("");function c(x,O){const pe=[];for(let J=29;J>=0;J--){const ue=new Date;ue.setDate(ue.getDate()-J);const xe=ue.toISOString().slice(0,10);pe.push(x.filter(me=>{const re=me[O];return re&&re.slice(0,10)===xe}).length)}return pe}const m=c(t,"created_at"),p=c(a,"created_at"),r=m.reduce((x,O)=>x+O,0),w=p.reduce((x,O)=>x+O,0),S=u.cities.findAll().map(x=>({...x,liveCount:Ft(x.city_id)})).sort((x,O)=>O.liveCount-x.liveCount).slice(0,5),A=Math.max(...S.map(x=>x.liveCount),1),_=S.map((x,O)=>['<div class="adm-top-city">','<span class="adm-city-rank">'+(O+1)+"</span>",'<div class="adm-city-row-info">','<span class="adm-city-name">'+q(x.name)+"</span>",'<div class="adm-city-bar-wrap"><div class="adm-city-bar" style="width:'+Math.round(x.liveCount/A*100)+'%"></div></div>',"</div>",'<span class="adm-city-count">'+x.liveCount+"</span>","</div>"].join("")).join(""),$={free:0,premium:29,pro:49,admin:0},E=u.users.findAll().reduce((x,O)=>x+($[O.subscription_tier]||0),0),j=(E>0?[{label:"Subscriptions",value:E,pct:100,color:"#1a1a1a"}]:[{label:"No revenue yet",value:0,pct:0,color:"#94a3b8"}]).map(x=>['<div class="adm-rev-row">','<div class="adm-rev-dot" style="background:'+x.color+'"></div>','<span class="adm-rev-label">'+x.label+"</span>",'<div class="adm-rev-bar-wrap"><div class="adm-rev-bar" style="width:'+x.pct+"%;background:"+x.color+'"></div></div>','<span class="adm-rev-value">$'+x.value.toLocaleString()+"</span>","</div>"].join("")).join(""),M=ri(5),R=ni(5),F=M.length?M.map((x,O)=>'<div class="adm-search-row"><span class="adm-search-rank">'+(O+1)+'</span><span class="adm-search-query">'+q(x.query)+'</span><span class="adm-search-count">'+x.count+"x</span></div>").join(""):'<div class="adm-search-row" style="color:#94a3b8">No searches recorded yet</div>',H=R.length?R.map(x=>'<div class="adm-search-row zero"><i class="fa-solid fa-circle-xmark"></i><span class="adm-search-query">'+q(x.query)+'</span><span class="adm-search-count">'+x.count+"x</span></div>").join(""):'<div class="adm-search-row" style="color:#94a3b8">No zero-result searches</div>';e.innerHTML=['<div class="adm-section-header"><h2>Analytics</h2></div>','<div class="adm-analytics-grid">','<div class="adm-panel adm-panel-full">','<div class="adm-panel-header"><h3>Conversion Funnel</h3><span style="font-size:.8rem;color:#64748b">Based on '+o.toLocaleString()+" tracked page views</span></div>",'<div class="adm-funnel">'+h+"</div>","</div>",'<div class="adm-panel">','<div class="adm-panel-header"><h3>New Users (30 days) <span style="font-size:.85rem;font-weight:400">+'+r+"</span></h3></div>",'<div class="adm-chart-box">'+Te(m,"#1a1a1a",500,140)+"</div>","</div>",'<div class="adm-panel">','<div class="adm-panel-header"><h3>Listings Published (30 days) <span style="font-size:.85rem;font-weight:400">+'+w+"</span></h3></div>",'<div class="adm-chart-box">'+Jt(p,"#333333",500,140)+"</div>","</div>",'<div class="adm-panel">','<div class="adm-panel-header"><h3>Top Cities by Activity</h3></div>','<div class="adm-top-cities">'+_+"</div>","</div>",'<div class="adm-panel">','<div class="adm-panel-header"><h3>Revenue Breakdown <span style="font-size:.85rem;font-weight:400">MRR: $'+E.toLocaleString()+"</span></h3></div>",'<div class="adm-rev-list">'+j+"</div>","</div>",'<div class="adm-panel">','<div class="adm-panel-header"><h3>Top Search Queries</h3></div>','<div class="adm-search-list">'+F+"</div>","</div>",'<div class="adm-panel">','<div class="adm-panel-header"><h3>Zero-Result Queries</h3></div>','<div class="adm-search-list">'+H+"</div>","</div>","</div>"].join("")}function xa(e){let t="countries",a=null,i=null,s=!1,o=!1;const n=ee();function l(){const d=u.countries.findAll(),v=u.cities.findAll().sort((p,r)=>(r.listing_count||0)-(p.listing_count||0)),b=a||s?(()=>{const p=a||{};return['<div class="adm-city-form-panel">','<div class="adm-panel-header"><h3>'+(a?"Edit Country":"Add Country")+"</h3>",'<button class="adm-close-btn" id="adm-country-form-close"><i class="fa-solid fa-xmark"></i></button></div>','<div class="adm-form-grid">','<div class="adm-form-group"><label>Country Name *</label><input id="f-country-name" class="adm-input" value="'+q(p.name||"")+'" placeholder="e.g. United States"></div>','<div class="adm-form-group"><label>2-Letter Code *</label><input id="f-country-code" class="adm-input" value="'+q(p.code||"")+'" placeholder="e.g. US" maxlength="2" style="text-transform:uppercase;"></div>','<div class="adm-form-group"><label>Flag Emoji</label><input id="f-country-flag" class="adm-input" value="'+q(p.flag_emoji||"")+'" placeholder="e.g. 🇺🇸"></div>','<div class="adm-form-group"><label>Active</label><label class="adm-toggle-wrap" style="display:inline-flex"><input type="checkbox" id="f-country-active"'+(p.is_active!==!1?" checked":"")+'><span class="adm-toggle-slider"></span></label></div>','<div class="adm-form-group adm-form-full adm-form-actions">','<button class="btn btn-primary" id="adm-country-save"><i class="fa-solid fa-floppy-disk"></i> '+(a?"Save Changes":"Add Country")+"</button>",'<button class="btn btn-outline" id="adm-country-cancel">Cancel</button>',"</div>","</div>","</div>"].join("")})():"",y=d.map(p=>'<option value="'+p.country_id+'"'+((i?i.country:"")===p.country_id?" selected":"")+">"+q((p.flag_emoji?p.flag_emoji+" ":"")+p.name)+"</option>").join(""),g=i||o?(()=>{const p=i||{};return['<div class="adm-city-form-panel">','<div class="adm-panel-header"><h3>'+(i?"Edit: "+q(p.name):"Add New City")+"</h3>",'<button class="adm-close-btn" id="adm-city-form-close"><i class="fa-solid fa-xmark"></i></button></div>','<div class="adm-form-grid">','<div class="adm-form-group"><label>City Name *</label><input id="f-name" class="adm-input" value="'+q(p.name||"")+'" placeholder="e.g. New York"></div>','<div class="adm-form-group"><label>URL Slug *</label><input id="f-slug" class="adm-input" value="'+q(p.slug||"")+'" placeholder="e.g. new-york"></div>','<div class="adm-form-group"><label>Country *</label><select id="f-country" class="adm-input"><option value="">Select Country</option>'+y+"</select></div>",'<div class="adm-form-group"><label>State / Province</label><input id="f-state" class="adm-input" value="'+q(p.state_province||"")+'" placeholder="e.g. NY"></div>','<div class="adm-form-group"><label>Avg Rent ($/mo)</label><input id="f-rent" type="number" class="adm-input" value="'+(p.avg_rent||"")+'"></div>','<div class="adm-form-group"><label>Latitude</label><input id="f-lat" type="number" class="adm-input" value="'+(p.latitude||"")+'"></div>','<div class="adm-form-group"><label>Longitude</label><input id="f-lng" type="number" class="adm-input" value="'+(p.longitude||"")+'"></div>','<div class="adm-form-group adm-form-full"><label>City Image</label>','<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">','<i class="fa-solid fa-link" style="color:#64748b;flex-shrink:0;"></i>','<input id="f-hero-url" class="adm-input" style="flex:1;" value="'+q(p.hero_image&&!p.hero_image.startsWith("data:")?p.hero_image:"")+'" placeholder="Paste image URL (e.g. https://images.unsplash.com/...)">',"</div>",'<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">','<i class="fa-solid fa-upload" style="color:#64748b;flex-shrink:0;"></i>','<label class="adm-btn" style="cursor:pointer;margin:0;flex-shrink:0;"><i class="fa-solid fa-image"></i> Upload Image File','<input type="file" id="f-hero-file" accept="image/*" style="display:none;"></label>','<span id="f-hero-filename" style="font-size:0.8rem;color:#64748b;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;">'+(p.hero_image&&p.hero_image.startsWith("data:")?"Uploaded image stored":"No file chosen")+"</span>",'<button type="button" id="f-hero-clear" style="flex-shrink:0;background:none;border:none;color:#ef4444;cursor:pointer;font-size:0.8rem;display:'+(p.hero_image?"inline":"none")+'"><i class="fa-solid fa-xmark"></i> Clear</button>',"</div>",'<input type="hidden" id="f-hero-data" value="'+(p.hero_image&&p.hero_image.startsWith("data:")?q(p.hero_image):"")+'">',p.hero_image?'<img id="f-hero-preview" src="'+q(p.hero_image)+'" style="margin-top:4px;max-height:100px;border-radius:8px;object-fit:cover;display:block;">':'<img id="f-hero-preview" style="display:none;margin-top:4px;max-height:100px;border-radius:8px;object-fit:cover;">',"</div>",'<div class="adm-form-group adm-form-full"><label>Meta Title</label><input id="f-meta-title" class="adm-input" value="'+q(p.meta_title||"")+'"></div>','<div class="adm-form-group adm-form-full"><label>Meta Description</label><textarea id="f-meta-desc" class="adm-textarea">'+q(p.meta_description||"")+"</textarea></div>",'<div class="adm-form-group"><label>Active</label><label class="adm-toggle-wrap" style="display:inline-flex"><input type="checkbox" id="f-active"'+(p.is_active!==!1?" checked":"")+'><span class="adm-toggle-slider"></span></label></div>','<div class="adm-form-group"><label>Show on Homepage</label><label class="adm-toggle-wrap" style="display:inline-flex"><input type="checkbox" id="f-popular"'+(p.show_in_popular!==!1?" checked":"")+'><span class="adm-toggle-slider"></span></label></div>','<div class="adm-form-group"><label>Show in Popular Cities Section</label><label class="adm-toggle-wrap" style="display:inline-flex"><input type="checkbox" id="f-popular-section"'+(p.show_in_popular_section?" checked":"")+'><span class="adm-toggle-slider"></span></label></div>','<div class="adm-form-group"><label>Show in Footer City Directory</label><label class="adm-toggle-wrap" style="display:inline-flex"><input type="checkbox" id="f-footer"'+(p.show_in_footer!==!1?" checked":"")+'><span class="adm-toggle-slider"></span></label></div>','<div class="adm-form-group adm-form-full adm-form-actions">','<button class="btn btn-primary" id="adm-city-save"><i class="fa-solid fa-floppy-disk"></i> '+(i?"Save Changes":"Add City")+"</button>",'<button class="btn btn-outline" id="adm-city-cancel">Cancel</button>',"</div>","</div>","</div>"].join("")})():"",f=d.length?d.map(p=>{const r=v.filter(w=>w.country===p.country_id).length;return["<tr>","<td><strong>"+q((p.flag_emoji?p.flag_emoji+" ":"")+p.name)+"</strong></td>","<td>"+q(p.code||"—")+"</td>","<td>"+r+" "+(r===1?"city":"cities")+"</td>",'<td><label class="adm-toggle-wrap"><input type="checkbox" class="adm-country-active-toggle" data-id="'+p.country_id+'"'+(p.is_active!==!1?" checked":"")+'><span class="adm-toggle-slider"></span></label></td>','<td style="display:flex;gap:8px;">','<button class="adm-btn adm-btn-sm" data-edit-country="'+p.country_id+'"><i class="fa-solid fa-pen"></i> Edit</button>','<button class="adm-btn adm-btn-sm adm-btn-danger" data-del-country="'+p.country_id+'"><i class="fa-solid fa-trash"></i> Delete</button>',"</td>","</tr>"].join("")}).join(""):'<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:2rem;">No countries added yet.</td></tr>',h=v.length?v.map(p=>{const r=d.find(w=>w.country_id===p.country);return["<tr>","<td>",p.hero_image?'<img src="'+q(p.hero_image)+`" style="width:48px;height:36px;object-fit:cover;border-radius:6px;vertical-align:middle;margin-right:8px;" onerror="this.style.display='none'">`:"","<strong>"+q(p.name)+'</strong><br><small class="text-muted">'+q(p.slug)+"</small>","</td>","<td>"+(r?q((r.flag_emoji?r.flag_emoji+" ":"")+r.name):"—")+"</td>",'<td style="display:flex;gap:8px;">','<button class="adm-btn adm-btn-sm" data-edit-city="'+p.city_id+'"><i class="fa-solid fa-pen"></i> Edit</button>','<button class="adm-btn adm-btn-sm adm-btn-danger" data-del-city="'+p.city_id+'"><i class="fa-solid fa-trash"></i> Delete</button>',"</td>","</tr>"].join("")}).join(""):'<tr><td colspan="3" style="text-align:center;color:var(--text-muted);padding:2rem;">No cities added yet.</td></tr>';e.innerHTML=['<div class="adm-section-header"><h2>City Management</h2></div>','<div class="adm-tabs" style="display:flex;gap:0;margin-bottom:1.5rem;border-bottom:2px solid var(--border);">','<button class="adm-tab'+(t==="countries"?" active":"")+'" data-tab="countries" style="padding:.65rem 1.4rem;font-weight:600;border:none;background:none;cursor:pointer;border-bottom:2px solid '+(t==="countries"?"var(--primary)":"transparent")+";color:"+(t==="countries"?"var(--primary)":"var(--text-muted)")+';margin-bottom:-2px;">','<i class="fas fa-globe" style="margin-right:6px;"></i>Countries</button>','<button class="adm-tab'+(t==="cities"?" active":"")+'" data-tab="cities" style="padding:.65rem 1.4rem;font-weight:600;border:none;background:none;cursor:pointer;border-bottom:2px solid '+(t==="cities"?"var(--primary)":"transparent")+";color:"+(t==="cities"?"var(--primary)":"var(--text-muted)")+';margin-bottom:-2px;">','<i class="fas fa-city" style="margin-right:6px;"></i>Cities</button>',"</div>",'<div id="adm-countries-panel" style="display:'+(t==="countries"?"block":"none")+';">','<div style="display:flex;justify-content:flex-end;margin-bottom:1rem;">','<button class="btn btn-primary" id="adm-add-country"><i class="fa-solid fa-plus"></i> Add Country</button>',"</div>",b,'<div class="adm-table-wrap">','<table class="adm-table">',"<thead><tr><th>Country</th><th>Code</th><th>Cities</th><th>Active</th><th>Actions</th></tr></thead>","<tbody>"+f+"</tbody>","</table></div>","</div>",'<div id="adm-cities-panel" style="display:'+(t==="cities"?"block":"none")+';">','<div style="display:flex;justify-content:flex-end;margin-bottom:1rem;">','<button class="btn btn-primary" id="adm-add-city"><i class="fa-solid fa-plus"></i> Add City</button>',"</div>",g,'<div class="adm-table-wrap">','<table class="adm-table">',"<thead><tr><th>City</th><th>Country</th><th>Actions</th></tr></thead>","<tbody>"+h+"</tbody>","</table></div>","</div>"].join(""),e.querySelectorAll(".adm-tab").forEach(p=>{p.addEventListener("click",()=>{t=p.dataset.tab,a=null,s=!1,i=null,o=!1,l()})}),e.querySelector("#adm-add-country")?.addEventListener("click",()=>{s=!0,a=null,l()}),e.querySelector("#adm-country-form-close")?.addEventListener("click",()=>{s=!1,a=null,l()}),e.querySelector("#adm-country-cancel")?.addEventListener("click",()=>{s=!1,a=null,l()}),e.querySelectorAll("[data-edit-country]").forEach(p=>{p.addEventListener("click",()=>{a=u.countries.findById(p.dataset.editCountry),s=!1,l()})}),e.querySelectorAll("[data-del-country]").forEach(p=>{p.addEventListener("click",()=>{const r=p.dataset.delCountry;if(u.cities.find(S=>S.country===r).length>0){P("Remove all cities in this country first.","error");return}confirm("Delete this country?")&&(u.countries.delete(r),Z(n.user_id,"Deleted country",r),P("Country deleted."),l())})}),e.querySelectorAll(".adm-country-active-toggle").forEach(p=>{p.addEventListener("change",()=>{u.countries.update(p.dataset.id,{is_active:p.checked}),P("Country status updated.")})}),e.querySelector("#adm-country-save")?.addEventListener("click",()=>{const p=e.querySelector("#f-country-name").value.trim(),r=e.querySelector("#f-country-code").value.trim().toUpperCase();if(!p||!r){P("Country name and code are required.","error");return}const w=e.querySelector("#f-country-flag").value.trim(),S=e.querySelector("#f-country-active").checked,A=p.toLowerCase().replace(/\s+/g,"-");a?(u.countries.update(a.country_id,{name:p,code:r,flag_emoji:w,slug:A,is_active:S}),Z(n.user_id,"Updated country",p),P("Country updated.")):(u.countries.create({name:p,code:r,flag_emoji:w,slug:A,is_active:S}),Z(n.user_id,"Added country",p),P("Country added!")),a=null,s=!1,l()}),e.querySelector("#adm-add-city")?.addEventListener("click",()=>{o=!0,i=null,l()}),e.querySelector("#adm-city-form-close")?.addEventListener("click",()=>{o=!1,i=null,l()}),e.querySelector("#adm-city-cancel")?.addEventListener("click",()=>{o=!1,i=null,l()}),e.querySelectorAll("[data-edit-city]").forEach(p=>{p.addEventListener("click",()=>{i=u.cities.findById(p.dataset.editCity),o=!1,l()})}),e.querySelectorAll("[data-del-city]").forEach(p=>{p.addEventListener("click",()=>{confirm("Delete this city? This cannot be undone.")&&(u.cities.delete(p.dataset.delCity),Z(n.user_id,"Deleted city",p.dataset.delCity),P("City deleted."),l())})}),e.querySelector("#f-hero-file")?.addEventListener("change",async p=>{const r=p.target.files[0];if(!r)return;const w=e.querySelector("#f-hero-filename");w.textContent="Uploading...";try{const S=await Pe(r,"city-hero.jpg");e.querySelector("#f-hero-data").value=S,e.querySelector("#f-hero-url").value="",e.querySelector("#f-hero-filename").textContent=r.name,e.querySelector("#f-hero-clear").style.display="inline";const A=e.querySelector("#f-hero-preview");A.src=S,A.style.display="block",P("Image uploaded successfully.")}catch(S){console.warn("[ADMIN] Server upload failed, falling back to Base64:",S);const A=new FileReader;A.onload=_=>{const $=_.target.result;e.querySelector("#f-hero-data").value=$,e.querySelector("#f-hero-url").value="",e.querySelector("#f-hero-filename").textContent=r.name+" (Local)",e.querySelector("#f-hero-clear").style.display="inline";const E=e.querySelector("#f-hero-preview");E.src=$,E.style.display="block",P("Success! Image saved to your browser (Local Fallback).","success")},A.onerror=()=>{P("Upload failed and local fallback failed.","error"),w.textContent="Upload failed"},A.readAsDataURL(r)}}),e.querySelector("#f-hero-url")?.addEventListener("input",p=>{const r=p.target.value.trim(),w=e.querySelector("#f-hero-preview");r?(e.querySelector("#f-hero-data").value="",e.querySelector("#f-hero-filename").textContent="No file chosen",e.querySelector("#f-hero-file").value="",e.querySelector("#f-hero-clear").style.display="inline",w.src=r,w.style.display="block"):(w.style.display="none",e.querySelector("#f-hero-clear").style.display="none")}),e.querySelector("#f-hero-clear")?.addEventListener("click",()=>{e.querySelector("#f-hero-url").value="",e.querySelector("#f-hero-data").value="",e.querySelector("#f-hero-file").value="",e.querySelector("#f-hero-filename").textContent="No file chosen",e.querySelector("#f-hero-clear").style.display="none";const p=e.querySelector("#f-hero-preview");p.src="",p.style.display="none"});const c=e.querySelector("#f-name"),m=e.querySelector("#f-slug");c&&m&&!i&&c.addEventListener("input",p=>{m.value=p.target.value.toLowerCase().trim().replace(/[^a-z0-9\s-]/g,"").replace(/\s+/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"")}),e.querySelector("#adm-city-save")?.addEventListener("click",()=>{const p=e.querySelector("#f-name").value.trim(),w=e.querySelector("#f-slug").value.trim().toLowerCase().replace(/\s+/g,"-").replace(/[^a-z0-9-]/g,"").replace(/-+/g,"-").replace(/^-|-$/g,"");if(!p||!w){P("Name and slug are required.","error");return}const S=u.cities.findOne(T=>T.slug===w&&(!i||T.city_id!==i.city_id));if(S){P('A city with the slug "'+w+'" already exists ('+S.name+"). Please use a different name or slug.","error");return}const A=(e.querySelector("#f-hero-url")?.value||"").trim(),_=(e.querySelector("#f-hero-data")?.value||"").trim(),$=A||_;if($.startsWith("data:")&&$.length>2e5){P("Image is too large to store. Please use a smaller image or paste an image URL instead.","error");return}const E={name:p,slug:w,state_province:e.querySelector("#f-state").value.trim(),avg_rent:parseInt(e.querySelector("#f-rent").value)||0,latitude:parseFloat(e.querySelector("#f-lat").value)||0,longitude:parseFloat(e.querySelector("#f-lng").value)||0,hero_image:$,meta_title:e.querySelector("#f-meta-title").value.trim(),meta_description:e.querySelector("#f-meta-desc").value.trim(),is_active:e.querySelector("#f-active").checked,show_in_popular:e.querySelector("#f-popular").checked,show_in_popular_section:e.querySelector("#f-popular-section").checked,show_in_footer:e.querySelector("#f-footer").checked,country:e.querySelector("#f-country").value||"",listing_count:i?i.listing_count??0:0,member_count:i?i.member_count??0:0,faq_items:i?i.faq_items??[]:[],description:i?i.description??"":""};try{i?(u.cities.update(i.city_id,E),Z(n.user_id,"Updated city",p),P("City updated.")):(u.cities.create(E),Z(n.user_id,"Added new city",p),P("City added!")),i=null,o=!1,l()}catch(T){P(T.message||"Failed to save city. The image may be too large.","error")}})}l()}function wa(e){let t="cities",a=null,i=null,s=!1,o=!1;const n=ee();function l(){const d=u.fb_countries.findAll(),v=u.fb_cities.findAll(),b=a||s?(()=>{const c=a||{};return['<div class="adm-city-form-panel">','<div class="adm-panel-header"><h3>'+(a?"Edit Country":"Add Country")+"</h3>",'<button class="adm-close-btn" id="fbg-country-form-close"><i class="fa-solid fa-xmark"></i></button></div>','<div class="adm-form-grid">','<div class="adm-form-group adm-form-full"><label>Country Name *</label>','<input id="fbg-country-name" class="adm-input" value="'+q(c.country_name||"")+'" placeholder="e.g. United States"></div>','<div class="adm-form-group adm-form-full adm-form-actions">','<button class="btn btn-primary" id="fbg-country-save"><i class="fa-solid fa-floppy-disk"></i> '+(a?"Save Changes":"Add Country")+"</button>",'<button class="btn btn-outline" id="fbg-country-cancel">Cancel</button>',"</div>","</div>","</div>"].join("")})():"",y=d.map(c=>'<option value="'+c.fb_country_id+'"'+(i&&i.country_id===c.fb_country_id?" selected":"")+">"+q(c.country_name)+"</option>").join(""),g=i||o?(()=>{const c=i||{};return['<div class="adm-city-form-panel">','<div class="adm-panel-header"><h3>'+(i?"Edit City Group":"Add City Group")+"</h3>",'<button class="adm-close-btn" id="fbg-city-form-close"><i class="fa-solid fa-xmark"></i></button></div>','<div class="adm-form-grid">','<div class="adm-form-group"><label>Country *</label>','<select id="fbg-city-country" class="adm-input"><option value="">Select Country</option>'+y+"</select></div>",'<div class="adm-form-group"><label>City Name *</label>','<input id="fbg-city-name" class="adm-input" value="'+q(c.city_name||"")+'" placeholder="e.g. New York City"></div>','<div class="adm-form-group"><label>FB Group Name *</label>','<input id="fbg-city-group-name" class="adm-input" value="'+q(c.fb_group_name||"")+'" placeholder="e.g. NYC Rooms & Roommates"></div>','<div class="adm-form-group"><label>FB Group Link *</label>','<input id="fbg-city-group-link" class="adm-input" value="'+q(c.fb_group_link||"")+'" placeholder="https://facebook.com/groups/..."></div>','<div class="adm-form-group"><label>Total Members</label>','<input id="fbg-city-members" type="number" class="adm-input" value="'+(c.total_members||"")+'" placeholder="e.g. 24800"></div>','<div class="adm-form-group"><label>Priority (Order)</label>','<input id="fbg-city-priority" type="number" class="adm-input" value="'+(c.priority||"")+'" placeholder="e.g. 1"></div>','<div class="adm-form-group adm-form-full" style="display:flex;align-items:center;gap:20px;margin-top:10px;flex-wrap:wrap;">','<div style="display:flex;align-items:center;gap:10px;">','<label class="adm-toggle-wrap"><input type="checkbox" id="fbg-city-popular"'+(c.is_popular!==!1?" checked":"")+'><span class="adm-toggle-slider"></span></label>',"<span><strong>Show on Homepage</strong></span>","</div>",'<div style="display:flex;align-items:center;gap:10px;">','<label class="adm-toggle-wrap"><input type="checkbox" id="fbg-city-footer"'+(c.is_footer?" checked":"")+'><span class="adm-toggle-slider"></span></label>',"<span><strong>Show in Footer</strong></span>","</div>","</div>",'<div class="adm-form-group adm-form-full"><label>City Image</label>','<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">','<input id="fbg-city-image-url" class="adm-input" style="flex:1;min-width:200px;" value="'+q(c.city_image||"")+'" placeholder="Paste image URL or upload below">','<label class="adm-btn" style="cursor:pointer;margin:0;"><i class="fa-solid fa-upload"></i> Upload','<input type="file" id="fbg-city-image-file" accept="image/*" style="display:none;"></label>',"</div>",c.city_image?'<img id="fbg-city-img-preview" src="'+q(c.city_image)+'" style="margin-top:8px;max-height:100px;border-radius:8px;object-fit:cover;">':'<img id="fbg-city-img-preview" style="display:none;margin-top:8px;max-height:100px;border-radius:8px;object-fit:cover;">',"</div>",'<div class="adm-form-group adm-form-full adm-form-actions">','<button class="btn btn-primary" id="fbg-city-save"><i class="fa-solid fa-floppy-disk"></i> '+(i?"Save Changes":"Add City")+"</button>",'<button class="btn btn-outline" id="fbg-city-cancel">Cancel</button>',"</div>","</div>","</div>"].join("")})():"",f=d.length?d.map(c=>{const m=v.filter(p=>p.country_id===c.fb_country_id).length;return["<tr>","<td><strong>"+q(c.country_name)+"</strong></td>","<td>"+m+" "+(m===1?"city":"cities")+"</td>",'<td style="display:flex;gap:8px;">','<button class="adm-btn adm-btn-sm" data-edit-country="'+c.fb_country_id+'"><i class="fa-solid fa-pen"></i> Edit</button>','<button class="adm-btn adm-btn-sm adm-btn-danger" data-del-country="'+c.fb_country_id+'"><i class="fa-solid fa-trash"></i> Delete</button>',"</td>","</tr>"].join("")}).join(""):'<tr><td colspan="3" style="text-align:center;color:var(--text-muted);padding:2rem;">No countries added yet.</td></tr>',h=v.length?v.sort((c,m)=>(c.priority||0)-(m.priority||0)).map(c=>{const m=d.find(p=>p.fb_country_id===c.country_id);return["<tr>","<td>",c.city_image?'<img src="'+q(c.city_image)+'" style="width:48px;height:36px;object-fit:cover;border-radius:6px;vertical-align:middle;margin-right:8px;">':"","<strong>"+q(c.city_name)+"</strong>","</td>","<td>"+(m?q(m.country_name):"—")+"</td>",'<td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="'+q(c.fb_group_name)+'">'+q(c.fb_group_name)+"</td>",'<td><a href="'+q(c.fb_group_link)+'" target="_blank" rel="noopener" style="color:var(--primary);">Link <i class="fa-solid fa-arrow-up-right-from-square" style="font-size:.75rem;"></i></a></td>',"<td>"+(Number(c.total_members)||0).toLocaleString()+"</td>","<td>"+(c.priority||"—")+"</td>","<td>",'  <div style="display:flex;flex-direction:column;gap:4px;">','    <span class="adm-status-pill '+(c.is_popular!==!1?"pill-active":"pill-inactive")+'" style="font-size:0.65rem;">Home: '+(c.is_popular!==!1?"Yes":"No")+"</span>",'    <span class="adm-status-pill '+(c.is_footer?"pill-active":"pill-inactive")+'" style="font-size:0.65rem;">Footer: '+(c.is_footer?"Yes":"No")+"</span>","  </div>","</td>",'<td style="display:flex;gap:8px;">','<button class="adm-btn adm-btn-sm" data-edit-city="'+c.fb_city_id+'"><i class="fa-solid fa-pen"></i> Edit</button>','<button class="adm-btn adm-btn-sm adm-btn-danger" data-del-city="'+c.fb_city_id+'"><i class="fa-solid fa-trash"></i> Delete</button>',"</td>","</tr>"].join("")}).join(""):'<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:2rem;">No cities added yet.</td></tr>';e.innerHTML=['<div class="adm-section-header"><h2>FB Group Management</h2></div>','<div class="adm-tabs" style="display:flex;gap:0;margin-bottom:1.5rem;border-bottom:2px solid var(--border);">','<button class="adm-tab'+(t==="countries"?" active":"")+'" data-tab="countries" style="padding:.65rem 1.4rem;font-weight:600;border:none;background:none;cursor:pointer;border-bottom:2px solid '+(t==="countries"?"var(--primary)":"transparent")+";color:"+(t==="countries"?"var(--primary)":"var(--text-muted)")+';margin-bottom:-2px;">','<i class="fas fa-globe" style="margin-right:6px;"></i>Countries</button>','<button class="adm-tab'+(t==="cities"?" active":"")+'" data-tab="cities" style="padding:.65rem 1.4rem;font-weight:600;border:none;background:none;cursor:pointer;border-bottom:2px solid '+(t==="cities"?"var(--primary)":"transparent")+";color:"+(t==="cities"?"var(--primary)":"var(--text-muted)")+';margin-bottom:-2px;">','<i class="fas fa-city" style="margin-right:6px;"></i>Cities</button>',"</div>",'<div id="fbg-countries-panel" style="display:'+(t==="countries"?"block":"none")+';">','<div style="display:flex;justify-content:flex-end;margin-bottom:1rem;">','<button class="btn btn-primary" id="fbg-add-country"><i class="fa-solid fa-plus"></i> Add Country</button>',"</div>",b,'<div class="adm-table-wrap">','<table class="adm-table">',"<thead><tr><th>Country</th><th>Cities</th><th>Actions</th></tr></thead>","<tbody>"+f+"</tbody>","</table></div>","</div>",'<div id="fbg-cities-panel" style="display:'+(t==="cities"?"block":"none")+';">','<div style="display:flex;justify-content:flex-end;margin-bottom:1rem;">','<button class="btn btn-primary" id="fbg-add-city"><i class="fa-solid fa-plus"></i> Add City</button>',"</div>",g,'<div class="adm-table-wrap">','<table class="adm-table">',"<thead><tr><th>City</th><th>Country</th><th>Group Name</th><th>Members</th><th>Priority</th><th>Status</th><th>Actions</th></tr></thead>","<tbody>"+h+"</tbody>","</table></div>","</div>"].join(""),e.querySelectorAll(".adm-tab").forEach(c=>{c.addEventListener("click",()=>{t=c.dataset.tab,a=null,s=!1,i=null,o=!1,l()})}),e.querySelector("#fbg-add-country")?.addEventListener("click",()=>{s=!0,a=null,l()}),e.querySelector("#fbg-country-form-close")?.addEventListener("click",()=>{s=!1,a=null,l()}),e.querySelector("#fbg-country-cancel")?.addEventListener("click",()=>{s=!1,a=null,l()}),e.querySelectorAll("[data-edit-country]").forEach(c=>{c.addEventListener("click",()=>{a=u.fb_countries.findById(c.dataset.editCountry),s=!1,l()})}),e.querySelectorAll("[data-del-country]").forEach(c=>{c.addEventListener("click",()=>{const m=c.dataset.delCountry;if(u.fb_cities.find(r=>r.country_id===m).length>0){P("Remove all cities in this country first.","error");return}confirm("Delete this country?")&&(u.fb_countries.delete(m),Z(n.user_id,"Deleted FB country",m),P("Country deleted."),l())})}),e.querySelector("#fbg-country-save")?.addEventListener("click",()=>{const c=e.querySelector("#fbg-country-name").value.trim();if(!c){P("Country name is required.","error");return}a?(u.fb_countries.update(a.fb_country_id,{country_name:c}),Z(n.user_id,"Updated FB country",c),P("Country updated.")):(u.fb_countries.create({country_name:c}),Z(n.user_id,"Added FB country",c),P("Country added!")),a=null,s=!1,l()}),e.querySelector("#fbg-add-city")?.addEventListener("click",()=>{o=!0,i=null,l()}),e.querySelector("#fbg-city-form-close")?.addEventListener("click",()=>{o=!1,i=null,l()}),e.querySelector("#fbg-city-cancel")?.addEventListener("click",()=>{o=!1,i=null,l()}),e.querySelectorAll("[data-edit-city]").forEach(c=>{c.addEventListener("click",()=>{i=u.fb_cities.findById(c.dataset.editCity),o=!1,l()})}),e.querySelectorAll("[data-del-city]").forEach(c=>{c.addEventListener("click",()=>{confirm("Delete this city group?")&&(u.fb_cities.delete(c.dataset.delCity),Z(n.user_id,"Deleted FB city",c.dataset.delCity),P("City deleted."),l())})}),e.querySelector("#fbg-city-image-file")?.addEventListener("change",async c=>{const m=c.target.files[0];if(!m)return;const p=new FileReader;p.onload=async r=>{const w=await ua(r.target.result,800,600,.7);e.querySelector("#fbg-city-image-url").value=w;const S=e.querySelector("#fbg-city-img-preview");S.src=w,S.style.display="block"},p.readAsDataURL(m)}),e.querySelector("#fbg-city-image-url")?.addEventListener("input",c=>{const m=e.querySelector("#fbg-city-img-preview");m.src=c.target.value,m.style.display=c.target.value?"block":"none"}),e.querySelector("#fbg-city-save")?.addEventListener("click",()=>{const c=e.querySelector("#fbg-city-country").value,m=e.querySelector("#fbg-city-name").value.trim(),p=e.querySelector("#fbg-city-group-name").value.trim(),r=e.querySelector("#fbg-city-group-link").value.trim(),w=parseInt(e.querySelector("#fbg-city-members").value)||0,S=parseInt(e.querySelector("#fbg-city-priority").value)||0,A=e.querySelector("#fbg-city-popular").checked,_=e.querySelector("#fbg-city-footer").checked,$=e.querySelector("#fbg-city-image-url").value.trim();if(!c||!m||!p||!r){P("Country, city name, group name, and link are required.","error");return}const E={country_id:c,city_name:m,fb_group_name:p,fb_group_link:r,total_members:w,priority:S,is_popular:A,is_footer:_,city_image:$};i?(u.fb_cities.update(i.fb_city_id,E),Z(n.user_id,"Updated FB city",m),P("City updated.")):(u.fb_cities.create(E),Z(n.user_id,"Added FB city",m),P("City added!")),i=null,o=!1,l()})}l()}function Ne(e){const t={maintenanceMode:!1,requireApprovalAccounts:!1,requireApprovalListings:!0,allowGuestSearch:!0,maxListingsPerUser:5,siteName:"RoommateGroups",contactEmail:"support@roommategroups.com"};let a={...t};try{const i=localStorage.getItem("rg_admin_settings");i&&(a={...t,...JSON.parse(i)})}catch{}e.innerHTML=['<div class="adm-section-header">',"<h2>Platform Settings</h2>",'<button class="adm-btn adm-btn-primary" id="adm-save-settings"><i class="fa-solid fa-save"></i> Save Changes</button>',"</div>",'<div class="adm-settings-grid">','<div class="adm-card">',"<h3>General Configuration</h3>",'<div class="adm-form-group">',"<label>Site Name</label>",'<input type="text" id="set-sitename" class="adm-input" value="'+q(a.siteName)+'">',"</div>",'<div class="adm-form-group">',"<label>Support Email</label>",'<input type="email" id="set-email" class="adm-input" value="'+q(a.contactEmail)+'">',"</div>",'<div class="adm-form-group" style="display:flex;justify-content:space-between;align-items:center;gap:16px;">','<span><strong>Maintenance Mode</strong><br><small style="color:#64748b;">Disables public access to the platform</small></span>','<label class="adm-toggle-wrap"><input type="checkbox" id="set-maintenance"'+(a.maintenanceMode?" checked":"")+'><span class="adm-toggle-slider"></span></label>',"</div>","</div>",'<div class="adm-card">',"<h3>Moderation & Access</h3>",'<div class="adm-form-group" style="display:flex;justify-content:space-between;align-items:center;gap:16px;">','<span><strong>Require Account Approval</strong><br><small style="color:#64748b;">New users must be vetted by admins</small></span>','<label class="adm-toggle-wrap"><input type="checkbox" id="set-req-accounts"'+(a.requireApprovalAccounts?" checked":"")+'><span class="adm-toggle-slider"></span></label>',"</div>",'<div class="adm-form-group" style="display:flex;justify-content:space-between;align-items:center;gap:16px;">','<span><strong>Require Listing Approval</strong><br><small style="color:#64748b;">New listings run through the moderation queue</small></span>','<label class="adm-toggle-wrap"><input type="checkbox" id="set-req-listings"'+(a.requireApprovalListings?" checked":"")+'><span class="adm-toggle-slider"></span></label>',"</div>",'<div class="adm-form-group" style="display:flex;justify-content:space-between;align-items:center;gap:16px;">','<span><strong>Allow Guest Browsing</strong><br><small style="color:#64748b;">Unregistered users can view listings</small></span>','<label class="adm-toggle-wrap"><input type="checkbox" id="set-guest-search"'+(a.allowGuestSearch?" checked":"")+'><span class="adm-toggle-slider"></span></label>',"</div>",'<div class="adm-form-group">',"<label>Max Listings Per User</label>",'<input type="number" id="set-max-listings" class="adm-input" min="1" max="50" value="'+a.maxListingsPerUser+'">',"</div>","</div>",(()=>{const i=localStorage.getItem("rg_database")||"{}",s=(i.length/1024).toFixed(1),o=Math.min(100,Math.round(i.length/(5*1024*1024)*100)),n=o>85?"#ef4444":o>60?"#f59e0b":"#22c55e";let l;try{l=JSON.parse(i)}catch{l={}}const d=((l.cities||[]).reduce((g,f)=>g+(f.hero_image&&f.hero_image.startsWith("data:")?f.hero_image.length:0),0)/1024).toFixed(1),v=(JSON.stringify(l.admin_logs||[]).length/1024).toFixed(1),b=(JSON.stringify(l.reports||[]).length/1024).toFixed(1),y=((l.listings||[]).reduce((g,f)=>g+(f.photos||[]).filter(h=>h&&h.startsWith("data:")).reduce((h,c)=>h+c.length,0),0)/1024).toFixed(1);return['<div class="adm-card" style="grid-column:1/-1">',"<h3>Database Storage</h3>",'<div style="margin-bottom:1rem;">','<div style="display:flex;justify-content:space-between;margin-bottom:6px;"><span style="font-weight:600;">'+s+' KB used of ~5,120 KB</span><span style="color:'+n+';font-weight:700;">'+o+"%</span></div>",'<div style="height:10px;background:#e5e7eb;border-radius:99px;overflow:hidden;"><div style="height:100%;width:'+o+"%;background:"+n+';border-radius:99px;transition:width .4s;"></div></div>',"</div>",'<div class="adm-form-grid" style="margin-bottom:1.25rem;font-size:0.85rem;color:#64748b;">',"<div>📷 City hero images (embedded): <strong>"+d+" KB</strong></div>","<div>🏠 Listing photos (embedded): <strong>"+y+" KB</strong></div>","<div>📋 Admin logs: <strong>"+v+" KB</strong></div>","<div>🚩 Reports: <strong>"+b+" KB</strong></div>","</div>",'<div style="display:flex;flex-wrap:wrap;gap:10px;">','<button class="adm-btn" id="db-clean-city-imgs" title="Replace base64 city images with empty string"><i class="fa-solid fa-image"></i> Clear City Base64 Images ('+d+" KB)</button>",'<button class="adm-btn" id="db-clean-listing-imgs" title="Remove base64 listing photos"><i class="fa-solid fa-house"></i> Clear Listing Base64 Photos ('+y+" KB)</button>",'<button class="adm-btn" id="db-clean-logs" title="Delete all admin action logs"><i class="fa-solid fa-scroll"></i> Clear Admin Logs ('+v+" KB)</button>",'<button class="adm-btn" id="db-clean-reports" title="Delete resolved/dismissed reports"><i class="fa-solid fa-flag"></i> Clear Resolved Reports</button>','<button class="adm-btn adm-btn-danger" id="db-reset" title="Wipe all data and re-seed defaults"><i class="fa-solid fa-triangle-exclamation"></i> Full Reset</button>',"</div>","</div>"].join("")})(),"</div>"].join(""),e.querySelector("#adm-save-settings").addEventListener("click",()=>{const i={siteName:e.querySelector("#set-sitename").value.trim(),contactEmail:e.querySelector("#set-email").value.trim(),maintenanceMode:e.querySelector("#set-maintenance").checked,requireApprovalAccounts:e.querySelector("#set-req-accounts").checked,requireApprovalListings:e.querySelector("#set-req-listings").checked,allowGuestSearch:e.querySelector("#set-guest-search").checked,maxListingsPerUser:parseInt(e.querySelector("#set-max-listings").value,10)||5};localStorage.setItem("rg_admin_settings",JSON.stringify(i)),P("Platform settings saved successfully.");const s=ee();Z(s?.user_id,"Updated Platform Settings","System Settings")}),e.querySelector("#db-clean-city-imgs")?.addEventListener("click",()=>{if(!confirm("Remove all embedded (base64) city images? This cannot be undone. City image URLs will be cleared."))return;const i=JSON.parse(localStorage.getItem("rg_database")||"{}");let s=0;(i.cities||[]).forEach(o=>{o.hero_image&&o.hero_image.startsWith("data:")&&(o.hero_image="",s++)}),localStorage.setItem("rg_database",JSON.stringify(i)),P("Cleared base64 images from "+s+" cities. Refreshing…"),setTimeout(()=>Ne(e),800)}),e.querySelector("#db-clean-listing-imgs")?.addEventListener("click",()=>{if(!confirm("Remove all embedded (base64) listing photos? Listings will show placeholder images."))return;const i=JSON.parse(localStorage.getItem("rg_database")||"{}");let s=0;(i.listings||[]).forEach(o=>{if(Array.isArray(o.photos)){const n=o.photos.length;o.photos=o.photos.filter(l=>!l||!l.startsWith("data:")),s+=n-o.photos.length}}),localStorage.setItem("rg_database",JSON.stringify(i)),P("Removed "+s+" embedded listing photos. Refreshing…"),setTimeout(()=>Ne(e),800)}),e.querySelector("#db-clean-logs")?.addEventListener("click",()=>{if(!confirm("Delete all admin action logs? This cannot be undone."))return;const i=JSON.parse(localStorage.getItem("rg_database")||"{}");i.admin_logs=[],localStorage.setItem("rg_database",JSON.stringify(i)),P("Admin logs cleared. Refreshing…"),setTimeout(()=>Ne(e),800)}),e.querySelector("#db-clean-reports")?.addEventListener("click",()=>{if(!confirm("Delete all resolved and dismissed reports?"))return;const i=JSON.parse(localStorage.getItem("rg_database")||"{}"),s=(i.reports||[]).length;i.reports=(i.reports||[]).filter(o=>o.status==="pending"),localStorage.setItem("rg_database",JSON.stringify(i)),P("Removed "+(s-i.reports.length)+" closed reports. Refreshing…"),setTimeout(()=>Ne(e),800)}),e.querySelector("#db-reset")?.addEventListener("click",()=>{confirm("⚠️ FULL RESET: This will delete ALL data (users, listings, cities, posts) and restore defaults. Are you absolutely sure?")&&confirm("Second confirmation: All user accounts and listings will be permanently lost. Continue?")&&(localStorage.removeItem("rg_database"),P("Database reset. Reloading page…"),setTimeout(()=>window.location.reload(),1e3))})}async function _a(e){e.innerHTML='<div class="adm-empty" style="padding:4rem;"><i class="fas fa-spinner fa-spin fa-2x"></i><p style="margin-top:1rem;">Loading content...</p></div>';try{let J=function(){return u.posts.findAll()},ue=function(){return u.categories.findAll()},xe=function(B){return ue().map(C=>'<option value="'+q(C.name)+'"'+(C.name===B?" selected":"")+">"+q(C.name)+"</option>").join("")},me=function(B){return B.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")},re=function(B){const C=(B||"").replace(/<[^>]*>/g," ").trim().split(/\s+/).filter(Boolean).length;return Math.max(1,Math.round(C/200))+" min read"},we=function(B){const C=B||{};x={title:C.title||"",slug:C.slug||"",author:C.author?.name||"",category:C.category||"",tags:Array.isArray(C.tags)?C.tags.join(", "):C.tags||"",publishDate:C.publishDate||new Date().toISOString().slice(0,16),status:C.status||(C.is_published?"published":"draft"),excerpt:C.excerpt||"",image:C.image||C.featured_image||"",imgAlt:C.imgAlt||"",imgTitle:C.imgTitle||"",imgCaption:C.imgCaption||"",content:C.content||"",tocEnabled:C.tocEnabled||!1,seoTitle:C.seoTitle||"",seoDesc:C.seoDescription||"",focusKeyword:C.focusKeyword||"",canonicalUrl:C.canonicalUrl||"",metaRobots:C.metaRobots||"index,follow",ogTitle:C.ogTitle||"",ogDesc:C.ogDescription||"",ogImage:C.ogImage||"",ctaHeading:C.ctaHeading||"",ctaText:C.ctaText||"",ctaBtnText:C.ctaBtnText||"",ctaBtnLink:C.ctaBtnLink||"",ctaPosition:C.ctaPosition||"bottom",schemaType:C.schemaType||"BlogPosting",schemaJson:C.schemaText||"",redirectFrom:C.redirectFrom||"",redirectTo:C.redirectTo||""},H=Array.isArray(C.faqs)?C.faqs.map(W=>({q:W.q||W.question||"",a:W.a||W.answer||""})):[]},z=function(){const B={title:"#cms-title",slug:"#cms-slug",author:"#cms-author",category:"#cms-cat",tags:"#cms-tags",publishDate:"#cms-publish-date",status:"#cms-status",excerpt:"#cms-excerpt",imgAlt:"#cms-img-alt",imgTitle:"#cms-img-title",imgCaption:"#cms-img-caption",content:"#cms-content",seoTitle:"#cms-seo-title",seoDesc:"#cms-seo-desc",focusKeyword:"#cms-focus-keyword",canonicalUrl:"#cms-canonical",metaRobots:"#cms-meta-robots",ogTitle:"#cms-og-title",ogDesc:"#cms-og-desc",ogImage:"#cms-og-img",ctaHeading:"#cms-cta-head",ctaText:"#cms-cta-text",ctaBtnText:"#cms-cta-btn",ctaBtnLink:"#cms-cta-link",ctaPosition:"#cms-cta-position",schemaType:"#cms-schema-type",schemaJson:"#cms-schema",redirectFrom:"#cms-redirect-from",redirectTo:"#cms-redirect-to"};for(const[I,D]of Object.entries(B)){const U=e.querySelector(D);U&&(x[I]=U.type==="checkbox"?U.checked:U.value)}const C=e.querySelector("#cms-img");C&&(x.image=C.value);const W=e.querySelector("#cms-toc");W&&(x.tocEnabled=W.checked),e.querySelectorAll("[data-faq-q]").forEach(I=>{const D=parseInt(I.dataset.faqQ);H[D]||(H[D]={q:"",a:""}),H[D].q=I.value}),e.querySelectorAll("[data-faq-a]").forEach(I=>{const D=parseInt(I.dataset.faqA);H[D]||(H[D]={q:"",a:""}),H[D].a=I.value})},Me=function(B,C){return'<div style="text-align:right;font-size:0.75rem;color:#94a3b8;margin-top:4px;" id="'+B+'-counter">0 / '+C+" characters</div>"},vt=function(){return H.length?H.map((B,C)=>['<div class="faq-item" style="border:1px solid #e2e8f0;border-radius:8px;padding:14px;margin-bottom:10px;background:#fafafa;">','<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">','<strong style="font-size:0.78rem;color:#6366f1;text-transform:uppercase;letter-spacing:0.05em;">Question '+(C+1)+"</strong>",'<button data-action="remove_faq" data-faq-idx="'+C+'" style="background:none;border:none;cursor:pointer;color:#ef4444;padding:2px 6px;font-size:0.9rem;"><i class="fa-solid fa-xmark"></i></button>',"</div>",'<input type="text" data-faq-q="'+C+'" style="'+N+'margin-bottom:8px;" value="'+q(B.q)+'" placeholder="Enter question">','<textarea data-faq-a="'+C+'" style="'+de+'min-height:60px;">'+q(B.a)+"</textarea>","</div>"].join("")).join(""):'<div style="text-align:center;padding:16px;color:#94a3b8;border:1px dashed #e2e8f0;border-radius:8px;font-size:0.85rem;margin-bottom:10px;">No FAQ items yet.</div>'},ht=function(){return['<div style="'+G+'">','<div><label style="'+Q+'">Title <span style="color:#ef4444;">*</span></label>','<input type="text" id="cms-title" style="'+N+'" value="'+q(x.title)+'" placeholder="Enter blog post title"></div>','<div><label style="'+Q+'">Slug <span style="color:#ef4444;">*</span></label>','<div style="display:flex;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;background:#fff;">','<span style="padding:10px 12px;background:#f8fafc;font-size:0.8rem;color:#94a3b8;white-space:nowrap;border-right:1px solid #e2e8f0;">/blog/</span>','<input type="text" id="cms-slug" style="flex:1;padding:10px 12px;border:none;font-size:0.9rem;color:#1e293b;outline:none;" value="'+q(x.slug)+'" placeholder="url-friendly-slug">',"</div></div>","</div>",'<div style="'+G+'">','<div><label style="'+Q+'">Author</label>','<input type="text" id="cms-author" style="'+N+'" value="'+q(x.author)+'" placeholder="Author name"></div>','<div><label style="'+Q+'">Category</label>','<select id="cms-cat" style="'+ne+'"><option value="">Select Category</option>'+xe(x.category)+"</select></div>","</div>",'<div style="'+G+'">','<div><label style="'+Q+'">Tags <span style="font-weight:400;color:#94a3b8;">(comma-separated)</span></label>','<input type="text" id="cms-tags" style="'+N+'" value="'+q(x.tags)+'" placeholder="rent, roommate, guide"></div>','<div><label style="'+Q+'">Publish Date</label>','<input type="datetime-local" id="cms-publish-date" style="'+N+'" value="'+q(x.publishDate)+'"></div>',"</div>",'<div style="'+Y+'">','<label style="'+Q+'">Status</label>','<select id="cms-status" style="'+ne+'max-width:220px;">','<option value="draft"'+(x.status==="draft"?" selected":"")+">Draft</option>",'<option value="published"'+(x.status==="published"?" selected":"")+">Published</option>",'<option value="scheduled"'+(x.status==="scheduled"?" selected":"")+">Scheduled</option>","</select></div>",'<div style="'+Y+'">','<label style="'+Q+'">Excerpt / Short Description <span style="color:#ef4444;">*</span></label>','<textarea id="cms-excerpt" style="'+de+'min-height:80px;" maxlength="160" placeholder="Brief description for blog listing">'+q(x.excerpt)+"</textarea>",Me("cms-excerpt",160),"</div>"].join("")},bt=function(){const B=q(x.slug||"url-friendly-title"),C=q((x.seoTitle||x.title||"Meta Title").slice(0,60)),W=q((x.seoDesc||x.excerpt||"Meta description will appear here...").slice(0,160));return['<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px;margin-bottom:24px;">','<div style="font-size:0.72rem;font-weight:700;color:#94a3b8;margin-bottom:12px;text-transform:uppercase;letter-spacing:0.06em;">Google Search Preview</div>','<div style="font-size:0.75rem;color:#202124;margin-bottom:4px;">roommategroups.com › blog › <span id="seo-preview-slug">'+B+"</span></div>",'<div id="seo-preview-title" style="font-size:1.1rem;color:#1a0dab;margin-bottom:4px;line-height:1.3;">'+C+"</div>",'<div id="seo-preview-desc" style="font-size:0.85rem;color:#4d5156;line-height:1.5;">'+W+"</div>","</div>",'<div style="'+Y+'">','<label style="'+Q+'">Meta Title <span style="color:#ef4444;">*</span></label>','<input type="text" id="cms-seo-title" style="'+N+'" maxlength="60" value="'+q(x.seoTitle)+'" placeholder="SEO-optimized title (max 60 chars)">',Me("cms-seo-title",60),"</div>",'<div style="'+Y+'">','<label style="'+Q+'">Meta Description <span style="color:#ef4444;">*</span></label>','<textarea id="cms-seo-desc" style="'+de+'min-height:80px;" maxlength="160" placeholder="Compelling meta description (max 160 chars)">'+q(x.seoDesc)+"</textarea>",Me("cms-seo-desc",160),"</div>",'<div style="'+G+'">','<div><label style="'+Q+'">Focus Keyword</label>','<input type="text" id="cms-focus-keyword" style="'+N+'" value="'+q(x.focusKeyword)+'" placeholder="Primary keyword"></div>','<div><label style="'+Q+'">Canonical URL</label>','<input type="url" id="cms-canonical" style="'+N+'" value="'+q(x.canonicalUrl)+'" placeholder="https://..."></div>',"</div>",'<div style="'+Y+'">','<label style="'+Q+'">Meta Robots</label>','<select id="cms-meta-robots" style="'+ne+'max-width:280px;">','<option value="index,follow"'+(x.metaRobots==="index,follow"?" selected":"")+">index, follow (default)</option>",'<option value="noindex,follow"'+(x.metaRobots==="noindex,follow"?" selected":"")+">noindex, follow</option>",'<option value="index,nofollow"'+(x.metaRobots==="index,nofollow"?" selected":"")+">index, nofollow</option>",'<option value="noindex,nofollow"'+(x.metaRobots==="noindex,nofollow"?" selected":"")+">noindex, nofollow</option>","</select></div>"].join("")},yt=function(){const B=!!x.image;return['<h4 style="'+le+'">Featured Image</h4>','<div id="cms-img-dropzone" style="border:2px dashed #e2e8f0;border-radius:10px;padding:32px;text-align:center;cursor:pointer;background:#f8fafc;position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:180px;overflow:hidden;margin-bottom:16px;">','<input type="file" id="cms-img-file" accept="image/*" style="opacity:0;position:absolute;inset:0;width:100%;height:100%;cursor:pointer;z-index:10;">','<i class="fa-regular fa-image" style="font-size:2rem;color:#cbd5e1;margin-bottom:12px;pointer-events:none;"></i>','<div id="cms-img-preview-container" style="'+(B?"":"display:none;")+'position:absolute;inset:0;z-index:5;">','<img id="cms-img-preview" src="'+q(x.image)+'" style="width:100%;height:100%;object-fit:cover;opacity:0.7;">','<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:white;font-weight:600;text-shadow:0 1px 4px rgba(0,0,0,0.8);pointer-events:none;">Click or drag to replace</div>',"</div>",'<span id="cms-img-text" style="'+(B?"display:none;":"")+'font-weight:600;color:#475569;pointer-events:none;">Drag image here<br><small style="font-weight:400;color:#94a3b8;">or click to browse</small></span>',"</div>",'<input type="hidden" id="cms-img" value="'+q(x.image)+'">','<div style="'+G+'">','<div><label style="'+Q+'">Alt Text</label>','<input type="text" id="cms-img-alt" style="'+N+'" value="'+q(x.imgAlt)+'" placeholder="Describe image for SEO & accessibility"></div>','<div><label style="'+Q+'">Image Title</label>','<input type="text" id="cms-img-title" style="'+N+'" value="'+q(x.imgTitle)+'" placeholder="Title attribute"></div>',"</div>",'<div style="'+Y+'"><label style="'+Q+'">Caption</label>','<input type="text" id="cms-img-caption" style="'+N+'" value="'+q(x.imgCaption)+'" placeholder="Displayed below image"></div>','<h4 style="'+le+'margin-top:24px;">Blog Content</h4>','<div style="'+Y+'">','<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">','<label style="'+Q+'margin:0;">Content <span style="color:#ef4444;">*</span></label>','<span id="cms-readtime" style="font-size:0.78rem;color:#6366f1;background:#ede9fe;padding:3px 10px;border-radius:20px;font-weight:600;">'+q(re(x.content))+"</span>","</div>",'<textarea id="cms-content" style="'+de+'min-height:300px;font-family:monospace;font-size:0.85rem;" placeholder="<p>Write your blog post content here... HTML supported.</p>">'+q(x.content)+"</textarea>","</div>",'<div style="display:flex;align-items:center;gap:10px;padding:12px 16px;background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;margin-bottom:20px;">','<input type="checkbox" id="cms-toc" style="width:16px;height:16px;accent-color:#6366f1;" '+(x.tocEnabled?"checked":"")+">",'<div><label for="cms-toc" style="font-weight:600;font-size:0.9rem;cursor:pointer;">Auto-generate Table of Contents</label>','<div style="font-size:0.78rem;color:#64748b;">Automatically creates a TOC from H2/H3 headings</div></div>',"</div>",'<h4 style="'+le+'">FAQ Section</h4>',vt(),'<button data-action="add_faq" style="padding:8px 16px;border:2px dashed #e2e8f0;background:transparent;border-radius:8px;cursor:pointer;color:#6366f1;font-size:0.85rem;font-weight:600;width:100%;margin-top:4px;"><i class="fa-solid fa-plus"></i> Add Question</button>'].join("")},xt=function(){const B=x.ogTitle||x.seoTitle||x.title||"",C=x.ogDesc||x.seoDesc||x.excerpt||"",W=x.ogImage||x.image||"";return['<div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:12px 16px;margin-bottom:20px;font-size:0.82rem;color:#0369a1;">','<i class="fa-solid fa-circle-info"></i> OG fields auto-fill from SEO settings if left empty.',"</div>",'<div style="'+Y+'"><label style="'+Q+'">OG Title</label>','<input type="text" id="cms-og-title" style="'+N+'" value="'+q(x.ogTitle)+'" placeholder="Fallback: Meta Title"></div>','<div style="'+Y+'"><label style="'+Q+'">OG Description</label>','<textarea id="cms-og-desc" style="'+de+'min-height:80px;" placeholder="Fallback: Meta Description">'+q(x.ogDesc)+"</textarea></div>",'<div style="'+Y+'"><label style="'+Q+'">OG Image URL</label>','<input type="text" id="cms-og-img" style="'+N+'" value="'+q(x.ogImage)+'" placeholder="https://... (defaults to featured image)"></div>',B?['<h4 style="'+le+'margin-top:8px;">Social Preview</h4>','<div style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;max-width:480px;">','<div style="background:#f1f3f4;height:160px;display:flex;align-items:center;justify-content:center;color:#94a3b8;overflow:hidden;">',W?'<img src="'+q(W)+'" style="width:100%;height:100%;object-fit:cover;">':'<i class="fa-regular fa-image" style="font-size:2rem;"></i>',"</div>",'<div style="padding:12px;background:#f8f9fa;border-top:1px solid #e2e8f0;">','<div style="font-size:0.72rem;color:#94a3b8;text-transform:uppercase;margin-bottom:4px;">ROOMMATEGROUPS.COM</div>','<div style="font-weight:700;font-size:0.9rem;margin-bottom:4px;color:#1e293b;">'+q(B.slice(0,60))+"</div>",'<div style="font-size:0.8rem;color:#64748b;">'+q(C.slice(0,120))+"</div>","</div></div>"].join(""):""].join("")},wt=function(){const B=x.ctaHeading||x.ctaBtnText;return['<h4 style="'+le+'">Call to Action Block</h4>','<div style="'+Y+'"><label style="'+Q+'">CTA Heading</label>','<input type="text" id="cms-cta-head" style="'+N+'" value="'+q(x.ctaHeading)+'" placeholder="e.g. Find Your Perfect Roommate"></div>','<div style="'+Y+'"><label style="'+Q+'">CTA Text</label>','<textarea id="cms-cta-text" style="'+de+'min-height:70px;" placeholder="Supporting text for the CTA">'+q(x.ctaText)+"</textarea></div>",'<div style="'+G+'">','<div><label style="'+Q+'">Button Text</label>','<input type="text" id="cms-cta-btn" style="'+N+'" value="'+q(x.ctaBtnText)+'" placeholder="e.g. Get Started Free"></div>','<div><label style="'+Q+'">Button Link</label>','<input type="url" id="cms-cta-link" style="'+N+'" value="'+q(x.ctaBtnLink)+'" placeholder="https://..."></div>',"</div>",'<div style="'+Y+'"><label style="'+Q+'">CTA Position</label>','<select id="cms-cta-position" style="'+ne+'max-width:200px;">','<option value="top"'+(x.ctaPosition==="top"?" selected":"")+">Top of post</option>",'<option value="middle"'+(x.ctaPosition==="middle"?" selected":"")+">Middle of post</option>",'<option value="bottom"'+(x.ctaPosition==="bottom"?" selected":"")+">Bottom of post</option>","</select></div>",B?['<h4 style="'+le+'margin-top:8px;">Preview</h4>','<div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;border-radius:12px;padding:24px;text-align:center;">',x.ctaHeading?'<h3 style="margin:0 0 8px;font-size:1.1rem;">'+q(x.ctaHeading)+"</h3>":"",x.ctaText?'<p style="margin:0 0 16px;opacity:0.9;font-size:0.85rem;">'+q(x.ctaText)+"</p>":"",x.ctaBtnText?'<span style="display:inline-block;background:white;color:#6366f1;padding:8px 24px;border-radius:6px;font-weight:700;font-size:0.9rem;">'+q(x.ctaBtnText)+"</span>":"","</div>"].join(""):""].join("")},_t=function(){return['<div style="'+Y+'"><label style="'+Q+'">Schema Type</label>','<select id="cms-schema-type" style="'+ne+'max-width:260px;">',["BlogPosting","Article","HowTo","Guide","FAQPage"].map(B=>'<option value="'+B+'"'+(x.schemaType===B?" selected":"")+">"+B+"</option>").join(""),"</select></div>",'<div style="'+Y+'"><label style="'+Q+'">Custom Schema JSON-LD <span style="font-weight:400;color:#94a3b8;">(optional override)</span></label>','<textarea id="cms-schema" style="'+de+`min-height:120px;font-family:monospace;font-size:0.82rem;" placeholder='{"@context":"https://schema.org","@type":"BlogPosting",...}'>`+q(x.schemaJson)+"</textarea></div>",'<h4 style="'+le+'margin-top:8px;">301 Redirect</h4>','<div style="'+G+'">','<div><label style="'+Q+'">From (Old URL)</label>','<input type="text" id="cms-redirect-from" style="'+N+'" value="'+q(x.redirectFrom)+'" placeholder="/old-blog-url"></div>','<div><label style="'+Q+'">To (New URL)</label>','<input type="text" id="cms-redirect-to" style="'+N+'" value="'+q(x.redirectTo)+'" placeholder="/new-blog-url"></div>',"</div>",'<div style="background:#fefce8;border:1px solid #fde68a;border-radius:8px;padding:12px 16px;font-size:0.82rem;color:#92400e;">','<i class="fa-solid fa-triangle-exclamation"></i> Redirects are stored as metadata. Implement server-side 301 handling separately.',"</div>"].join("")},kt=function(B){const C=!!B,W=[{id:"basic",icon:"fa-circle-info",label:"Basic Info"},{id:"seo",icon:"fa-magnifying-glass",label:"SEO Settings"},{id:"content",icon:"fa-file-lines",label:"Content"},{id:"social",icon:"fa-share-nodes",label:"Social Sharing"},{id:"cta",icon:"fa-bullhorn",label:"CTA & Conversion"},{id:"advanced",icon:"fa-sliders",label:"Advanced"}],I=W.map(Le=>Le.id),D=I.indexOf(M),U=D===0,ie=D===I.length-1,ve=U?null:I[D-1],Se=ie?null:I[D+1],He=ve?W[D-1].label:"",Zt=Se?W[D+1].label:"",Xt=W.map((Le,Fe)=>{const at=M===Le.id,$t=Fe<D;return'<button data-modal-tab="'+Le.id+'" style="display:flex;align-items:center;gap:6px;padding:11px 16px;border:none;background:none;cursor:pointer;font-size:0.83rem;font-weight:'+(at?"700":"500")+";color:"+(at?"#6366f1":$t?"#22c55e":"#64748b")+";border-bottom:2px solid "+(at?"#6366f1":"transparent")+';white-space:nowrap;transition:color 0.15s;"><i class="fa-solid '+($t?"fa-circle-check":Le.icon)+'"></i>'+Le.label+"</button>"}).join(""),ei=W.map((Le,Fe)=>'<span style="display:inline-block;width:'+(Fe===D?"20px":"8px")+";height:8px;border-radius:4px;background:"+(Fe<D?"#22c55e":Fe===D?"#6366f1":"#e2e8f0")+';transition:all 0.2s;"></span>').join("");let qe;switch(M){case"seo":qe=bt();break;case"content":qe=yt();break;case"social":qe=xt();break;case"cta":qe=wt();break;case"advanced":qe=_t();break;default:qe=ht()}const ti=['<div style="padding:16px 24px;border-top:1px solid #e2e8f0;background:#f8fafc;border-radius:0 0 14px 14px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;">',"<div>",U?'<button type="button" data-action="close_modal" style="padding:9px 18px;border:1px solid #e2e8f0;background:#fff;color:#475569;border-radius:8px;cursor:pointer;font-size:0.85rem;font-weight:600;">Cancel</button>':'<button type="button" data-action="tab_prev" style="display:flex;align-items:center;gap:6px;padding:9px 18px;border:1px solid #e2e8f0;background:#fff;color:#475569;border-radius:8px;cursor:pointer;font-size:0.85rem;font-weight:600;"><i class="fa-solid fa-arrow-left"></i> Back: '+q(He)+"</button>","</div>",'<div style="display:flex;align-items:center;gap:6px;">'+ei+"</div>",'<div style="display:flex;gap:8px;">',ie?['<button type="button" data-action="save_draft_post" style="padding:9px 16px;background:#334155;border:1px solid #475569;color:#cbd5e1;border-radius:8px;cursor:pointer;font-size:0.85rem;font-weight:600;"><i class="fa-regular fa-floppy-disk"></i> Save Draft</button>','<button type="button" data-action="publish_post" style="padding:9px 18px;background:#22c55e;border:none;color:#fff;border-radius:8px;cursor:pointer;font-size:0.85rem;font-weight:700;"><i class="fa-solid fa-rocket"></i> Publish</button>'].join(""):'<button type="button" data-action="tab_next" style="display:flex;align-items:center;gap:6px;padding:9px 18px;background:#6366f1;border:none;color:#fff;border-radius:8px;cursor:pointer;font-size:0.85rem;font-weight:600;">Next: '+q(Zt)+' <i class="fa-solid fa-arrow-right"></i></button>',"</div>","</div>"].join("");return['<div class="adm-modal-overlay" style="position:fixed;inset:0;background:rgba(15,23,42,0.85);display:flex;align-items:flex-start;justify-content:center;z-index:9999;padding:20px;overflow-y:auto;">','<div style="background:#fff;color:#1e293b;width:100%;max-width:920px;border-radius:14px;box-shadow:0 30px 70px -12px rgba(0,0,0,0.6);display:flex;flex-direction:column;margin:auto;">','<div style="padding:16px 24px;border-bottom:1px solid #334155;display:flex;justify-content:space-between;align-items:center;background:linear-gradient(135deg,#1e293b,#334155);border-radius:14px 14px 0 0;flex-shrink:0;">','<div style="display:flex;align-items:center;gap:12px;">','<i class="fa-solid fa-newspaper" style="color:#818cf8;font-size:1.2rem;"></i>','<div><div style="color:#fff;font-weight:700;font-size:0.95rem;">Blog Publishing CMS</div>','<div style="color:#94a3b8;font-size:0.73rem;">'+(C?"Editing: "+q(B.title||"Post"):"Creating new post")+"</div></div>","</div>",'<div style="display:flex;align-items:center;gap:8px;">','<span id="cms-autosave-badge" style="font-size:0.73rem;color:#94a3b8;margin-right:8px;"></span>','<button type="button" data-action="close_modal" style="background:none;border:none;color:#94a3b8;cursor:pointer;padding:6px;font-size:1.1rem;margin-left:4px;line-height:1;"><i class="fa-solid fa-xmark"></i></button>',"</div></div>",'<div style="display:flex;border-bottom:1px solid #e2e8f0;overflow-x:auto;background:#f8fafc;flex-shrink:0;padding:0 8px;">',Xt,"</div>",'<div style="padding:24px;overflow-y:auto;max-height:calc(100vh - 240px);">',qe,"</div>",ti,"</div></div>"].join("")},ae=function(){const B=J(),C=ue(),W=['<div class="adm-section-header">',"<h2>Content & Blog Management</h2>",E==="posts"?'<button class="adm-btn adm-btn-primary" data-action="new_post"><i class="fa-solid fa-plus"></i> New Post</button>':'<button class="adm-btn adm-btn-primary" data-action="new_cat"><i class="fa-solid fa-plus"></i> New Category</button>',"</div>",'<div style="display:flex;gap:6px;margin-bottom:18px;">','<button class="adm-btn '+(E==="posts"?"adm-btn-primary":"")+'" data-action="tab_posts"><i class="fa-solid fa-newspaper"></i> Posts</button>','<button class="adm-btn '+(E==="categories"?"adm-btn-primary":"")+'" data-action="tab_categories"><i class="fa-solid fa-tags"></i> Categories</button>',"</div>"];if(E==="posts"){if(W.push('<div class="adm-card"><div class="adm-table-responsive">','<table class="adm-table"><thead><tr>',"<th>Post Title</th><th>Category</th><th>Status</th><th>Author</th><th>Reading Time</th>",'<th style="text-align:right;">Actions</th>',"</tr></thead><tbody>"),!B||B.length===0?W.push('<tr><td colspan="6" style="text-align:center;padding:2rem;color:#94a3b8;">No blog posts yet. Click <strong>New Post</strong> to get started.</td></tr>'):[...B].reverse().forEach(I=>{const D=I.post_id||I.id,U=I.status||(I.is_published?"published":"draft"),ie=U==="published"?"#16a34a":U==="scheduled"?"#d97706":"#64748b",ve=U==="published"?"#dcfce7":U==="scheduled"?"#fef3c7":"#f1f5f9";W.push("<tr>","<td><strong>"+q(I.title||"Untitled")+'</strong><br><small style="color:var(--text-light);">/blog/'+q(I.slug||"")+"</small></td>",'<td><span class="adm-badge" style="background:var(--bg-elevated);color:var(--text);border:1px solid var(--border);">'+q(I.category||"Uncategorized")+"</span></td>",'<td><span style="display:inline-block;padding:3px 10px;border-radius:20px;font-size:0.75rem;font-weight:600;background:'+ve+";color:"+ie+';">'+U.charAt(0).toUpperCase()+U.slice(1)+"</span></td>","<td>"+q(I.author?.name||"Admin")+"</td>","<td>"+q(I.readTime||re(I.content||""))+"</td>",'<td style="text-align:right;display:flex;justify-content:flex-end;gap:8px;">','<button class="adm-btn adm-btn-icon" title="Edit" data-action="edit_post" data-post-id="'+D+'"><i class="fa-solid fa-pen"></i></button>','<button class="adm-btn adm-btn-icon" style="color:var(--danger);" title="Delete" data-action="delete_post" data-post-id="'+D+'"><i class="fa-solid fa-trash"></i></button>',"</td></tr>")}),W.push("</tbody></table></div></div>"),T){const I=j?B.find(D=>String(D.post_id||D.id)===String(j)):null;W.push(kt(I))}}else if(W.push('<div class="adm-card"><div class="adm-table-responsive">','<table class="adm-table"><thead><tr>',"<th>Name</th><th>Slug</th><th>Description</th><th>Color</th><th>Posts</th>",'<th style="text-align:right;">Actions</th>',"</tr></thead><tbody>"),!C||C.length===0?W.push('<tr><td colspan="6" style="text-align:center;padding:2rem;">No categories found.</td></tr>'):C.forEach(I=>{const D=I.category_id,U=B.filter(ve=>ve.category===I.name).length,ie=U===0;W.push("<tr>","<td><strong>"+q(I.name)+"</strong></td>",'<td><code style="font-size:0.82rem;color:var(--text-light);">'+q(I.slug||"")+"</code></td>",'<td style="max-width:220px;white-space:normal;">'+q(I.description||"—")+"</td>",'<td><span style="display:inline-flex;align-items:center;gap:6px;"><span style="display:inline-block;width:16px;height:16px;border-radius:3px;background:'+q(I.color||"#999")+';"></span>'+q(I.color||"")+"</span></td>","<td>"+U+"</td>",'<td style="text-align:right;display:flex;justify-content:flex-end;gap:8px;">','<button class="adm-btn adm-btn-icon" title="Edit" data-action="edit_cat" data-cat-id="'+D+'"><i class="fa-solid fa-pen"></i></button>','<button class="adm-btn adm-btn-icon" style="color:var(--danger);" title="'+(ie?"Delete":"Has posts — reassign first")+'" data-action="delete_cat" data-cat-id="'+D+'"'+(ie?"":" disabled")+'><i class="fa-solid fa-trash"></i></button>',"</td></tr>")}),W.push("</tbody></table></div></div>"),R){const I=F?C.find(U=>String(U.category_id)===String(F)):null,D=!!I;W.push('<div class="adm-modal-overlay" style="position:fixed;inset:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:9999;">','<div style="background:#fff;color:#1e293b;width:90%;max-width:480px;border-radius:12px;box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);display:flex;flex-direction:column;max-height:90vh;">','<div style="padding:20px 24px;border-bottom:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;">','<h3 style="margin:0;font-size:1.25rem;">'+(D?"Edit Category":"New Category")+"</h3>",'<button data-action="close_cat_modal" style="background:none;border:none;font-size:1.2rem;cursor:pointer;"><i class="fa-solid fa-xmark"></i></button>',"</div>",'<div style="padding:24px;overflow-y:auto;flex:1;">','<div style="margin-bottom:16px;"><label style="display:block;margin-bottom:8px;font-weight:500;">Name *</label>','<input type="text" id="cat-name" class="form-input" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:6px;" value="'+(D?q(I.name):"")+'" placeholder="e.g. City Guides"></div>','<div style="margin-bottom:16px;"><label style="display:block;margin-bottom:8px;font-weight:500;">Slug *</label>','<input type="text" id="cat-slug" class="form-input" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:6px;" value="'+(D?q(I.slug):"")+'" placeholder="city-guides"></div>','<div style="margin-bottom:16px;"><label style="display:block;margin-bottom:8px;font-weight:500;">Description</label>','<input type="text" id="cat-desc" class="form-input" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:6px;" value="'+(D?q(I.description||""):"")+'" placeholder="Short description"></div>','<div style="margin-bottom:24px;"><label style="display:block;margin-bottom:8px;font-weight:500;">Color</label>','<div style="display:flex;align-items:center;gap:10px;">','<input type="color" id="cat-color" style="width:44px;height:38px;border:1px solid var(--border);border-radius:6px;cursor:pointer;padding:2px;" value="'+(D?q(I.color||"#1a1a1a"):"#1a1a1a")+'">','<input type="text" id="cat-color-text" class="form-input" style="flex:1;padding:10px;border:1px solid var(--border);border-radius:6px;" value="'+(D?q(I.color||"#1a1a1a"):"#1a1a1a")+'" placeholder="#1a1a1a">',"</div></div>","</div>",'<div style="padding:16px 24px;border-top:1px solid #e2e8f0;display:flex;justify-content:flex-end;gap:12px;background:#f8fafc;border-radius:0 0 12px 12px;">','<button class="adm-btn" data-action="close_cat_modal" style="background:#fff;border:1px solid #dddddd;color:#334155;">Cancel</button>','<button class="adm-btn adm-btn-primary" data-action="save_cat">Save Category</button>',"</div></div></div>")}e.innerHTML=W.join(""),St()},St=function(){e.querySelector('[data-action="tab_posts"]')?.addEventListener("click",()=>{E="posts",T=!1,ae()}),e.querySelector('[data-action="tab_categories"]')?.addEventListener("click",()=>{E="categories",R=!1,ae()}),E==="posts"?(e.querySelector('[data-action="new_post"]')?.addEventListener("click",()=>{j=null,H=[],x={},we(null),T=!0,M="basic",ae()}),e.querySelectorAll('[data-action="edit_post"]').forEach(B=>{B.addEventListener("click",()=>{const C=B.dataset.postId;j=C;const W=J().find(I=>String(I.post_id||I.id)===String(C));H=[],x={},we(W),T=!0,M="basic",ae()})}),e.querySelectorAll('[data-action="delete_post"]').forEach(B=>{B.addEventListener("click",()=>{const C=B.dataset.postId;C&&confirm("Delete this post? This cannot be undone.")&&(u.posts.delete(C),P("Post deleted."),ae())})}),T&&qt()):Lt()},qt=function(){const B=["basic","seo","content","social","cta","advanced"];e.querySelectorAll("[data-modal-tab]").forEach(I=>{I.addEventListener("click",()=>{z(),M=I.dataset.modalTab,ae()})}),e.querySelector('[data-action="tab_next"]')?.addEventListener("click",()=>{z();const I=B.indexOf(M);I<B.length-1&&(M=B[I+1],ae())}),e.querySelector('[data-action="tab_prev"]')?.addEventListener("click",()=>{z();const I=B.indexOf(M);I>0&&(M=B[I-1],ae())}),e.querySelectorAll('[data-action="close_modal"]').forEach(I=>{I.addEventListener("click",()=>{T=!1,x={},H=[],ae()})}),e.querySelector("#cms-img-file")?.addEventListener("change",async I=>{const D=I.target.files[0];if(!D)return;const U=e.querySelector("#cms-img-text");U&&(U.innerHTML='<i class="fas fa-spinner fa-spin"></i><br>Uploading...');try{const ie=await Pe(D,"blog-post.jpg");x.image=ie;const ve=e.querySelector("#cms-img"),Se=e.querySelector("#cms-img-preview-container"),He=e.querySelector("#cms-img-preview");ve&&(ve.value=ie),Se&&He&&U&&(He.src=ie,Se.style.display="block",U.style.display="none"),P("Blog image uploaded.")}catch(ie){P("Upload failed: "+ie.message,"error"),U&&(U.innerHTML='Drag image here<br><small style="font-weight:400;color:#94a3b8;">or click to browse</small>')}}),e.querySelector("#cms-title")?.addEventListener("input",I=>{if(x.title=I.target.value,!j){const D=e.querySelector("#cms-slug");D&&(D.value=me(I.target.value),x.slug=D.value)}De(),tt()}),e.querySelector("#cms-slug")?.addEventListener("input",I=>{x.slug=I.target.value,De()}),[["cms-excerpt",160],["cms-seo-title",60],["cms-seo-desc",160]].forEach(([I,D])=>{const U=e.querySelector("#"+I),ie=e.querySelector("#"+I+"-counter");if(!U||!ie)return;const ve=()=>{const Se=U.value.length;ie.textContent=Se+" / "+D+" characters",ie.style.color=Se>D*.9?"#ef4444":"#94a3b8"};ve(),U.addEventListener("input",ve)}),e.querySelector("#cms-seo-title")?.addEventListener("input",()=>De()),e.querySelector("#cms-seo-desc")?.addEventListener("input",()=>De());const C=e.querySelector("#cms-content"),W=e.querySelector("#cms-readtime");C&&W&&C.addEventListener("input",I=>{x.content=I.target.value,W.textContent=re(I.target.value),tt()}),e.querySelector('[data-action="add_faq"]')?.addEventListener("click",()=>{z(),H.push({q:"",a:""}),ae()}),e.querySelectorAll('[data-action="remove_faq"]').forEach(I=>{I.addEventListener("click",()=>{z(),H.splice(parseInt(I.dataset.faqIdx),1),ae()})}),e.querySelectorAll('[data-action="save_draft_post"]').forEach(I=>{I.addEventListener("click",()=>{z(),it("draft")})}),e.querySelectorAll('[data-action="publish_post"]').forEach(I=>{I.addEventListener("click",()=>{z(),it("published")})})},De=function(){const B=e.querySelector("#cms-seo-title")?.value||x.title||"",C=e.querySelector("#cms-seo-desc")?.value||x.excerpt||"",W=e.querySelector("#cms-slug")?.value||x.slug||"",I=e.querySelector("#seo-preview-title"),D=e.querySelector("#seo-preview-desc"),U=e.querySelector("#seo-preview-slug");I&&(I.textContent=B.slice(0,60)||"Meta Title"),D&&(D.textContent=C.slice(0,160)||"Meta description will appear here..."),U&&(U.textContent=W||"url-friendly-title")},tt=function(){clearTimeout(O);const B=e.querySelector("#cms-autosave-badge");B&&(B.textContent="Saving..."),O=setTimeout(()=>{z();try{localStorage.setItem(pe,JSON.stringify({formState:x,faqItems:H,editingPostId:j,ts:Date.now()}))}catch{}B&&(B.textContent="Saved",setTimeout(()=>{B&&(B.textContent="")},2e3))},1500)},it=function(B){try{const C=(x.title||"").trim(),W=(x.slug||"").trim();if(!C){alert("Title is required.");return}if(!W){alert("Slug is required.");return}if(!x.content?.trim()){alert("Content is required (go to the Content tab).");return}const I=(x.author||"Admin").trim(),D={title:C,slug:W,status:B,category:x.category||"",excerpt:x.excerpt||"",content:x.content||"",seoTitle:x.seoTitle||"",seoDescription:x.seoDesc||"",focusKeyword:x.focusKeyword||"",canonicalUrl:x.canonicalUrl||"",metaRobots:x.metaRobots||"index,follow",ogTitle:x.ogTitle||x.seoTitle||"",ogDescription:x.ogDesc||x.seoDesc||"",ogImage:x.ogImage||x.image||"",image:x.image||"",featured_image:x.image||"",imgAlt:x.imgAlt||"",imgTitle:x.imgTitle||"",imgCaption:x.imgCaption||"",tocEnabled:x.tocEnabled||!1,faqs:H.filter(U=>U.q||U.a),ctaHeading:x.ctaHeading||"",ctaText:x.ctaText||"",ctaBtnText:x.ctaBtnText||"",ctaBtnLink:x.ctaBtnLink||"",ctaPosition:x.ctaPosition||"bottom",schemaType:x.schemaType||"BlogPosting",schemaText:x.schemaJson||"",redirectFrom:x.redirectFrom||"",redirectTo:x.redirectTo||"",tags:(x.tags||"").split(",").map(U=>U.trim()).filter(Boolean),is_published:B==="published",readTime:re(x.content||""),publishDate:x.publishDate||new Date().toISOString()};if(j){const U=u.posts.findOne(ie=>String(ie.post_id||ie.id)===String(j));if(U)u.posts.update(U.post_id||U.id,{...U,...D,date:U.date,author:{...U.author,name:I||U.author?.name||"Admin"}}),P("Post updated.");else{alert("Post not found.");return}}else u.posts.create({...D,author:{name:I,avatar:"https://ui-avatars.com/api/?name="+encodeURIComponent(I)+"&background=6366f1&color=fff",bio:"Contributing writer at RoommateGroups."},date:new Date().toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}),published_date:new Date().toISOString()}),P(B==="published"?"Post published!":"Draft saved.");try{localStorage.removeItem(pe)}catch{}T=!1,j=null,x={},H=[],ae()}catch(C){alert("Error saving post: "+C.message)}},Lt=function(){e.querySelector('[data-action="new_cat"]')?.addEventListener("click",()=>{F=null,R=!0,ae()}),e.querySelectorAll('[data-action="edit_cat"]').forEach(B=>{B.addEventListener("click",()=>{F=B.dataset.catId,R=!0,ae()})}),e.querySelectorAll('[data-action="delete_cat"]').forEach(B=>{B.addEventListener("click",()=>{const C=B.dataset.catId;!C||B.disabled||confirm("Delete this category?")&&(u.categories.delete(C),P("Category deleted."),ae())})}),e.querySelectorAll('[data-action="close_cat_modal"]').forEach(B=>{B.addEventListener("click",()=>{R=!1,ae()})}),e.querySelector("#cat-color")?.addEventListener("input",B=>{const C=e.querySelector("#cat-color-text");C&&(C.value=B.target.value)}),e.querySelector("#cat-color-text")?.addEventListener("input",B=>{const C=e.querySelector("#cat-color");C&&/^#[0-9a-fA-F]{6}$/.test(B.target.value)&&(C.value=B.target.value)}),e.querySelector("#cat-name")?.addEventListener("input",B=>{const C=e.querySelector("#cat-slug");C&&!F&&(C.value=me(B.target.value))}),e.querySelector('[data-action="save_cat"]')?.addEventListener("click",()=>{const B=e.querySelector("#cat-name")?.value.trim(),C=e.querySelector("#cat-slug")?.value.trim();if(!B||!C){alert("Name and Slug are required.");return}const W=e.querySelector("#cat-desc")?.value.trim(),I=e.querySelector("#cat-color-text")?.value.trim()||"#1a1a1a";if(F){const D=u.categories.findOne(U=>String(U.category_id)===String(F));D&&(u.categories.update(D.category_id,{...D,name:B,slug:C,description:W,color:I}),P("Category updated."))}else u.categories.create({name:B,slug:C,description:W,color:I}),P("Category created.");R=!1,F=null,ae()})};var t=J,a=ue,i=xe,s=me,o=re,n=we,l=z,d=Me,v=vt,b=ht,y=bt,g=yt,f=xt,h=wt,c=_t,m=kt,p=ae,r=St,w=qt,S=De,A=tt,_=it,$=Lt;let E="posts",T=!1,j=null,M="basic",R=!1,F=null,H=[],x={},O=null;const pe="cms_autosave_draft",N="width:100%;padding:10px 12px;border:1px solid #e2e8f0;border-radius:8px;font-size:0.9rem;color:#1e293b;background:#fff;box-sizing:border-box;outline:none;",ne="width:100%;padding:10px 12px;border:1px solid #e2e8f0;border-radius:8px;font-size:0.9rem;color:#1e293b;background:#fff;box-sizing:border-box;",de="width:100%;padding:10px 12px;border:1px solid #e2e8f0;border-radius:8px;font-size:0.9rem;color:#1e293b;background:#fff;resize:vertical;box-sizing:border-box;outline:none;",Q="display:block;margin-bottom:6px;font-weight:600;font-size:0.85rem;color:#374151;",G="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;",Y="margin-bottom:16px;",le="margin:0 0 16px;font-size:0.8rem;font-weight:700;color:#6366f1;text-transform:uppercase;letter-spacing:0.06em;padding-bottom:8px;border-bottom:2px solid #ede9fe;";ae()}catch(E){console.error("Error in renderAdminContent:",E),e.innerHTML=['<div class="adm-section-header"><h2>Content & Blog Management</h2></div>','<div class="adm-empty">','<i class="fa-solid fa-triangle-exclamation" style="color:var(--danger);"></i>',"<h3>Error Loading Content</h3>","<p>"+q(E.message)+"</p>","</div>"].join("")}}function ka(e,t){e.innerHTML=['<div class="adm-section-header"><h2>'+q(t)+"</h2></div>",'<div class="adm-empty">','<i class="fa-solid fa-hammer"></i>',"<h3>"+q(t)+" — Coming Soon</h3>","<p>This section is under construction. Check back soon!</p>","</div>"].join("")}function Sa(e){const t={account:"Account & Login",listing:"Listing Help",safety:"Safety & Scam Report",billing:"Billing & Subscription",verification:"Verification Issues",partnership:"Partnership / Press",other:"Other"};function a(y){if(!y)return"—";const g=new Date(y);return g.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})+" "+g.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"})}function i(y){return y.status==="replied"?'<span style="background:#d1fae5;color:#065f46;padding:3px 10px;border-radius:20px;font-size:0.75rem;font-weight:700;">Replied</span>':y.is_read?'<span style="background:#f1f5f9;color:#475569;padding:3px 10px;border-radius:20px;font-size:0.75rem;font-weight:700;">Read</span>':'<span style="background:#fee2e2;color:#991b1b;padding:3px 10px;border-radius:20px;font-size:0.75rem;font-weight:700;">New</span>'}function s(y){const g=["First Name","Last Name","Email","Topic","Message","Date","Status","Reply"],f=y.map(r=>[r.first_name,r.last_name,r.email,r.topic_label||r.topic,r.message,a(r.created_at),r.status==="replied"?"Replied":r.is_read?"Read":"New",r.reply||""].map(w=>'"'+String(w||"").replace(/"/g,'""')+'"')),h=[g.join(","),...f.map(r=>r.join(","))].join(`
`),c=new Blob([h],{type:"text/csv"}),m=URL.createObjectURL(c),p=document.createElement("a");p.href=m,p.download="user-queries-"+new Date().toISOString().slice(0,10)+".csv",p.click(),URL.revokeObjectURL(m)}function o(y){const g=e.querySelector("#queries-table-body");if(g){if(y.length===0){g.innerHTML='<tr><td colspan="7" style="text-align:center;padding:40px;color:#94a3b8;"><i class="fa-solid fa-inbox" style="font-size:1.5rem;display:block;margin-bottom:8px;"></i>No queries found.</td></tr>';return}g.innerHTML=y.map(f=>['<tr style="'+(!f.is_read&&f.status!=="replied"?"background:#fffbeb;":"")+'">','<td style="padding:12px 14px;"><div style="font-weight:600;color:#1e293b;">'+q(f.first_name+" "+f.last_name)+"</div></td>",'<td style="padding:12px 14px;color:#64748b;font-size:0.9rem;">'+q(f.email)+"</td>",'<td style="padding:12px 14px;"><span style="background:#f1f5f9;color:#334155;padding:2px 8px;border-radius:6px;font-size:0.8rem;">'+q(f.topic_label||f.topic)+"</span></td>",'<td style="padding:12px 14px;max-width:260px;"><div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#475569;font-size:0.9rem;" title="'+q(f.message)+'">'+q(f.message)+"</div></td>",'<td style="padding:12px 14px;color:#64748b;font-size:0.85rem;white-space:nowrap;">'+a(f.created_at)+"</td>",'<td style="padding:12px 14px;">'+i(f)+"</td>",'<td style="padding:12px 14px;">','<div style="display:flex;gap:6px;">',f.status!=="replied"?'<button class="qry-reply-btn adm-btn-sm" data-id="'+f.query_id+'" style="background:#1a1a1a;color:white;border:none;padding:5px 12px;border-radius:6px;cursor:pointer;font-size:0.8rem;"><i class="fa-solid fa-reply"></i> Reply</button>':'<button class="qry-view-reply-btn adm-btn-sm" data-id="'+f.query_id+'" style="background:#e2e8f0;color:#334155;border:none;padding:5px 12px;border-radius:6px;cursor:pointer;font-size:0.8rem;"><i class="fa-solid fa-eye"></i> View</button>',f.is_read?"":'<button class="qry-read-btn" data-id="'+f.query_id+'" style="background:transparent;border:1px solid #cbd5e1;color:#64748b;padding:5px 10px;border-radius:6px;cursor:pointer;font-size:0.8rem;" title="Mark as read"><i class="fa-solid fa-envelope-open"></i></button>',"</div>","</td>","</tr>"].join("")).join(""),g.querySelectorAll(".qry-reply-btn").forEach(f=>{f.addEventListener("click",()=>n(f.dataset.id))}),g.querySelectorAll(".qry-view-reply-btn").forEach(f=>{f.addEventListener("click",()=>n(f.dataset.id,!0))}),g.querySelectorAll(".qry-read-btn").forEach(f=>{f.addEventListener("click",()=>{u.user_queries.update(f.dataset.id,{is_read:!0}),l()})})}}function n(y,g=!1){const f=u.user_queries.findById(y);if(!f)return;f.is_read||u.user_queries.update(y,{is_read:!0});const h=document.getElementById("qry-modal");document.getElementById("qry-modal-name").textContent=f.first_name+" "+f.last_name,document.getElementById("qry-modal-email").textContent=f.email,document.getElementById("qry-modal-topic").textContent=f.topic_label||f.topic,document.getElementById("qry-modal-date").textContent=a(f.created_at),document.getElementById("qry-modal-message").textContent=f.message,document.getElementById("qry-modal-id").value=y;const c=document.getElementById("qry-reply-text"),m=document.getElementById("qry-send-btn"),p=document.getElementById("qry-prev-reply");f.reply?(p.style.display="block",p.querySelector(".qry-prev-reply-text").textContent=f.reply,p.querySelector(".qry-prev-reply-date").textContent="Sent: "+a(f.replied_at)):p.style.display="none",g?(c.style.display="none",m.style.display="none"):(c.style.display="block",m.style.display="block",c.value=""),h.style.display="flex"}function l(){const y=(e.querySelector("#qry-search")?.value||"").toLowerCase(),g=e.querySelector("#qry-filter-topic")?.value||"",f=e.querySelector("#qry-filter-date")?.value||"",h=e.querySelector("#qry-filter-status")?.value||"";let c=u.user_queries.findAll().sort((m,p)=>new Date(p.created_at)-new Date(m.created_at));if(y&&(c=c.filter(m=>(m.first_name+" "+m.last_name).toLowerCase().includes(y)||m.email.toLowerCase().includes(y)||m.message.toLowerCase().includes(y))),g&&(c=c.filter(m=>m.topic===g)),h==="new"&&(c=c.filter(m=>!m.is_read&&m.status!=="replied")),h==="read"&&(c=c.filter(m=>m.is_read&&m.status!=="replied")),h==="replied"&&(c=c.filter(m=>m.status==="replied")),f){const m=new Date;c=c.filter(p=>{const r=new Date(p.created_at);return f==="today"?r.toDateString()===m.toDateString():f==="week"?m-r<=7*864e5:f==="month"?r.getMonth()===m.getMonth()&&r.getFullYear()===m.getFullYear():f==="year"?r.getFullYear()===m.getFullYear():!0})}return o(c),e.querySelector("#qry-count").textContent=c.length+" quer"+(c.length===1?"y":"ies"),c}const v=u.user_queries.findAll().filter(y=>!y.is_read).length;e.innerHTML=["<style>",".qry-toolbar{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:20px;}",".qry-toolbar input,.qry-toolbar select{padding:8px 12px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:0.875rem;outline:none;background:white;}",".qry-toolbar input:focus,.qry-toolbar select:focus{border-color:#1a1a1a;}",".qry-table-wrap{overflow-x:auto;border-radius:12px;border:1px solid #e2e8f0;}",".qry-table{width:100%;border-collapse:collapse;font-size:0.875rem;}",".qry-table thead th{background:#f8fafc;padding:10px 14px;text-align:left;font-weight:700;color:#475569;font-size:0.8rem;text-transform:uppercase;letter-spacing:0.04em;border-bottom:1px solid #e2e8f0;}",".qry-table tbody tr{border-bottom:1px solid #f1f5f9;}",".qry-table tbody tr:hover{background:#f8fafc;}",".qry-modal{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;align-items:center;justify-content:center;padding:20px;}",".qry-modal-box{background:white;border-radius:16px;padding:32px;max-width:560px;width:100%;max-height:90vh;overflow-y:auto;}",".qry-modal-field{margin-bottom:14px;}",".qry-modal-field label{font-size:0.78rem;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;display:block;margin-bottom:4px;}",".qry-modal-field .val{color:#1e293b;font-size:0.95rem;}",".qry-msg-box{background:#f8fafc;border-radius:10px;padding:14px;color:#334155;font-size:0.9rem;line-height:1.6;white-space:pre-wrap;margin-bottom:16px;}",".qry-reply-textarea{width:100%;padding:12px;border:1.5px solid #e2e8f0;border-radius:10px;font-size:0.9rem;font-family:inherit;resize:vertical;min-height:100px;outline:none;box-sizing:border-box;}",".qry-reply-textarea:focus{border-color:#1a1a1a;}","</style>",'<div class="adm-section-header" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">',"<div>","<h2>User Queries</h2>",v>0?'<p style="color:#64748b;font-size:0.9rem;margin-top:4px;">'+v+" unread quer"+(v===1?"y":"ies")+" awaiting review.</p>":"","</div>",'<button id="qry-export-btn" style="background:#1a1a1a;color:white;border:none;padding:9px 18px;border-radius:8px;cursor:pointer;font-size:0.875rem;font-weight:600;"><i class="fa-solid fa-download"></i> Export CSV</button>',"</div>",'<div class="qry-toolbar">','<input type="text" id="qry-search" placeholder="Search name, email, message..." style="flex:1;min-width:200px;">','<select id="qry-filter-topic">','<option value="">All Topics</option>',Object.entries(t).map(([y,g])=>'<option value="'+y+'">'+g+"</option>").join(""),"</select>",'<select id="qry-filter-date">','<option value="">All Dates</option>','<option value="today">Today</option>','<option value="week">This Week</option>','<option value="month">This Month</option>','<option value="year">This Year</option>',"</select>",'<select id="qry-filter-status">','<option value="">All Status</option>','<option value="new">New</option>','<option value="read">Read</option>','<option value="replied">Replied</option>',"</select>",'<span id="qry-count" style="color:#64748b;font-size:0.85rem;white-space:nowrap;"></span>',"</div>",'<div class="qry-table-wrap">','<table class="qry-table">',"<thead><tr>","<th>Name</th><th>Email</th><th>Topic</th><th>Message</th><th>Date</th><th>Status</th><th>Actions</th>","</tr></thead>",'<tbody id="queries-table-body"></tbody>',"</table>","</div>",'<div class="qry-modal" id="qry-modal">','<div class="qry-modal-box">','<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">','<h3 style="font-size:1.1rem;font-weight:800;color:#1e293b;">Query Details</h3>','<button id="qry-modal-close" style="background:none;border:none;font-size:1.3rem;cursor:pointer;color:#64748b;">✕</button>',"</div>",'<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px;">','<div class="qry-modal-field"><label>From</label><div class="val" id="qry-modal-name"></div></div>','<div class="qry-modal-field"><label>Email</label><div class="val" id="qry-modal-email"></div></div>','<div class="qry-modal-field"><label>Topic</label><div class="val" id="qry-modal-topic"></div></div>','<div class="qry-modal-field"><label>Date</label><div class="val" id="qry-modal-date"></div></div>',"</div>",'<div class="qry-modal-field"><label>Message</label><div class="qry-msg-box" id="qry-modal-message"></div></div>','<div id="qry-prev-reply" style="display:none;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px;margin-bottom:14px;">','<div style="font-size:0.78rem;font-weight:700;color:#065f46;margin-bottom:6px;"><i class="fa-solid fa-check-circle"></i> Reply Sent</div>','<div class="qry-prev-reply-text" style="color:#166534;font-size:0.9rem;white-space:pre-wrap;"></div>','<div class="qry-prev-reply-date" style="font-size:0.78rem;color:#64748b;margin-top:6px;"></div>',"</div>",'<div class="qry-modal-field">',"<label>Reply Message</label>",'<textarea id="qry-reply-text" class="qry-reply-textarea" placeholder="Write your reply here..."></textarea>',"</div>",'<input type="hidden" id="qry-modal-id">','<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px;">','<button id="qry-cancel-btn" style="background:#f1f5f9;color:#475569;border:none;padding:9px 18px;border-radius:8px;cursor:pointer;font-weight:600;">Cancel</button>','<button id="qry-send-btn" style="background:#1a1a1a;color:white;border:none;padding:9px 20px;border-radius:8px;cursor:pointer;font-weight:700;"><i class="fa-solid fa-paper-plane"></i> Send Reply</button>',"</div>","</div>","</div>"].join(""),l(),e.querySelector("#qry-search")?.addEventListener("input",l),e.querySelector("#qry-filter-topic")?.addEventListener("change",l),e.querySelector("#qry-filter-date")?.addEventListener("change",l),e.querySelector("#qry-filter-status")?.addEventListener("change",l),e.querySelector("#qry-export-btn")?.addEventListener("click",()=>{const y=u.user_queries.findAll().sort((g,f)=>new Date(f.created_at)-new Date(g.created_at));s(y)});const b=e.querySelector("#qry-modal");e.querySelector("#qry-modal-close")?.addEventListener("click",()=>{b.style.display="none",l()}),e.querySelector("#qry-cancel-btn")?.addEventListener("click",()=>{b.style.display="none",l()}),b?.addEventListener("click",y=>{y.target===b&&(b.style.display="none",l())}),e.querySelector("#qry-send-btn")?.addEventListener("click",()=>{const y=document.getElementById("qry-modal-id").value,g=document.getElementById("qry-reply-text").value.trim();if(!g){P("Please write a reply message.","error");return}u.user_queries.update(y,{status:"replied",is_read:!0,reply:g,replied_at:new Date().toISOString()});const f=u.user_queries.findById(y),h=encodeURIComponent("Re: Your query – "+(f?.topic_label||f?.topic||"Support")),c=encodeURIComponent(g);window.open("mailto:"+(f?.email||"")+"?subject="+h+"&body="+c),b.style.display="none",l(),P("Reply sent and query marked as Replied."),Z("user_admin_1","Replied to query","Query from "+(f?.first_name||"")+" "+(f?.last_name||"")+" — "+(f?.email||""))})}function qa(e){e.innerHTML=`
    <div class="auth-page">
      <div class="auth-card admin-login-card">
        <div class="auth-header">
          <div class="admin-logo">
            <i class="fas fa-shield-halved"></i>
            <span>RG Admin</span>
          </div>
          <h1>Admin Login</h1>
          <p>Access the RoommateGroups Admin Control Panel</p>
        </div>

        <div class="admin-security-notice">
          <i class="fas fa-lock"></i>
          <span>This area is restricted to administrators only</span>
        </div>

        <!-- Admin Login Form -->
        <form class="auth-form" id="admin-login-form" novalidate>
          <div class="form-group">
            <label for="admin-email">Admin Email</label>
            <div class="input-wrapper">
              <i class="fas fa-user-shield"></i>
              <input type="email" id="admin-email" class="form-input" placeholder="admin@roommategroups.com" required autocomplete="email" />
            </div>
            <div class="form-error" id="email-error"></div>
          </div>

          <div class="form-group">
            <label for="admin-password">Admin Password</label>
            <div class="input-wrapper">
              <i class="fas fa-key"></i>
              <input type="password" id="admin-password" class="form-input" placeholder="Enter admin password" required autocomplete="current-password" />
              <button type="button" class="password-toggle" id="toggle-password" aria-label="Toggle password visibility">
                <i class="fas fa-eye"></i>
              </button>
            </div>
            <div class="form-error" id="password-error"></div>
          </div>

          <div class="form-error form-error-global" id="global-error"></div>

          <button type="submit" class="btn btn-danger btn-lg auth-submit" id="admin-login-btn">
            <i class="fas fa-shield-halved"></i>
            Access Admin Panel
          </button>
        </form>

        <div class="auth-footer">
          <div class="admin-footer-links">
            <a href="/" class="auth-link">
              <i class="fas fa-arrow-left"></i>
              Back to Home
            </a>
            <a href="/auth/login" class="auth-link">
              <i class="fas fa-user"></i>
              User Login
            </a>
          </div>
        </div>
      </div>
    </div>

    <div class="toast" id="toast"></div>
  `;const t=document.getElementById("admin-login-form"),a=document.getElementById("admin-password"),i=document.getElementById("toggle-password");i.addEventListener("click",()=>{const s=a.type==="password"?"text":"password";a.type=s,i.querySelector("i").className=s==="password"?"fas fa-eye":"fas fa-eye-slash"}),t.addEventListener("submit",s=>{s.preventDefault(),La();const o=document.getElementById("admin-email").value.trim(),n=a.value;let l=!0;if((!o||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(o))&&(Ve("email-error","Please enter a valid email address."),l=!1),n||(Ve("password-error","Please enter your password."),l=!1),!l)return;const d=document.getElementById("admin-login-btn");d.disabled=!0,d.innerHTML='<i class="fas fa-spinner fa-spin"></i> Authenticating...',setTimeout(async()=>{const v=await Nt(o,n);if(!v.success){Ve("global-error",v.error),d.disabled=!1,d.innerHTML='<i class="fas fa-shield-halved"></i> Access Admin Panel';return}if(v.user.role!=="admin"){Ve("global-error","Access denied. Admin privileges required."),d.disabled=!1,d.innerHTML='<i class="fas fa-shield-halved"></i> Access Admin Panel';return}$a("Admin access granted!","success"),setTimeout(()=>{X("/admin")},1e3)},600)})}function Ve(e,t){const a=document.getElementById(e);a&&(a.textContent=t,a.classList.add("visible"))}function La(){document.querySelectorAll(".form-error").forEach(e=>{e.textContent="",e.classList.remove("visible")})}function $a(e,t="info"){const a=document.getElementById("toast");a.textContent=e,a.className=`toast toast-${t} visible`,setTimeout(()=>a.classList.remove("visible"),4e3)}function be(){return async(e,t)=>{const a=ee();return console.log("[ADMIN MIDDLEWARE] Checking admin access for path:",e),console.log("[ADMIN MIDDLEWARE] User:",a?.email,"role:",a?.role),a?Ht()?(console.log("[ADMIN MIDDLEWARE] Admin access granted for:",a.email),!0):(console.log("[ADMIN MIDDLEWARE] User is not admin, redirecting to dashboard"),X("/dashboard"),!1):(console.log("[ADMIN MIDDLEWARE] No user found, redirecting to admin login"),X("/admin-login"),!1)}}function ye(){return async(e,t)=>{const a=ee();return a?(console.log("[Auth] User authenticated:",a.email),!0):(console.log("[Auth] No user found, redirecting to login"),X("/auth/login"),!1)}}function Ye(e){return e?String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"):""}function Ea(e,t){return e?typeof e=="string"?e:e[t]||e.thumb||e.medium||"":""}function Aa(e){const t=Date.now()-new Date(e).getTime(),a=Math.floor(t/36e5);return a<1?"Just now":a<24?a+" hours ago":Math.floor(a/24)+" days ago"}function Bt(e){const t=e.category==="roommate_wanted",a=e.photos&&e.photos[0],i=(a?Ea(a,"thumb"):null)||"https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&h=400&fit=crop";let s=e.user_details;!s&&e.user_id&&(s=u.users.findById(e.user_id));const o=s?s.display_name:"Unknown",n=s&&s.profile_photo?s.profile_photo:"https://ui-avatars.com/api/?name="+encodeURIComponent(o)+"&background=1a1a1a&color=fff",l=s?je(s):"";let d="";e.room_type&&(d+='<span class="s-card-tag">'+e.room_type+"</span>"),e.furnished==="yes"&&(d+='<span class="s-card-tag">Furnished</span>');const v=ee();let b=!1;if(v){const y=u.users.findById(v.id);y&&y.saved_listings&&y.saved_listings.includes(e.listing_id)&&(b=!0)}return`
        <div class="s-card" data-id="${e.listing_id}" data-lat="${e.latitude}" data-lng="${e.longitude}">
            <a href="/listing/${e.listing_id}" class="s-card-img-wrap" style="display:block;">
                <img src="${t?n:i}" alt="${Ye(e.title)}" class="s-card-img" loading="lazy">
                <button class="s-card-fav ${b?"active":""}">
                    <i class="${b?"fa-solid":"fa-regular"} fa-heart" ${b?'style="color:#1a1a1a;"':""}></i>
                </button>
                <div class="s-card-tags">
                    ${d}
                </div>
            </a>
            <div class="s-card-body">
                <div class="s-card-price">$${e.price}<span>/mo</span></div>
                <a href="/listing/${e.listing_id}" style="text-decoration:none; color:inherit;"><h3 class="s-card-title">${Ye(e.title)}</h3></a>
                <div class="s-card-meta">
                    <i class="fa-solid fa-location-dot"></i> ${Ye(u.cities.findOne(y=>y.city_id===e.city)?.name||(e.city?e.city.replace("city_","").replace(/_/g," "):"Unknown City"))}
                </div>
                <div class="s-card-footer">
                    <div class="s-card-poster">
                        <img src="${n}" alt="">
                        <span>${Ye(o)} ${l}</span>
                    </div>
                    <div class="s-card-time">${Aa(e.created_at)}</div>
                </div>
            </div>
        </div>
    `}function Ca(e){const t=window.location.search.slice(1),a=new URLSearchParams(t),i={country:a.get("country")||"all",city:a.get("city")||"all",type:a.get("type")||"all",minPrice:a.get("minPrice")||"",maxPrice:a.get("maxPrice")||"",sort:a.get("sort")||"newest",dur:a.get("dur")||"all",furn:a.get("furn")||"all",verified:a.get("verified")==="true",amenities:a.get("amenities")?a.get("amenities").split(","):[]},s=u.cities.findAll().filter(_=>_.is_active),o=u.countries.findAll().filter(_=>_.is_active);e.innerHTML=`
        ${se()}
        <div class="search-layout">
            <div class="search-sidebar">
                <div class="search-filters" id="search-filters-bar">
                    <!-- Row 1: Selects + Price + More -->
                    <div class="sf-row sf-row-selects">
                        <div class="s-filter-group">
                            <i class="fa-solid fa-globe sf-icon"></i>
                            <select id="sf-country" class="sf-input">
                                <option value="all">All Countries</option>
                                ${o.map(_=>`<option value="${_.country_id}" ${i.country===_.country_id?"selected":""}>${_.flag_emoji} ${_.name}</option>`).join("")}
                            </select>
                        </div>
                        <div class="s-filter-group">
                            <i class="fa-solid fa-location-dot sf-icon"></i>
                            <select id="sf-city" class="sf-input">
                                <option value="all">Anywhere</option>
                                ${(i.country!=="all"?s.filter(_=>_.country===i.country):s).map(_=>`<option value="${_.slug}" ${i.city===_.slug?"selected":""}>${_.name}</option>`).join("")}
                            </select>
                        </div>
                        <div class="s-filter-group sf-price-group">
                            <i class="fa-solid fa-dollar-sign sf-icon"></i>
                            <input type="number" id="sf-min-price" class="sf-input sf-price" placeholder="Min $" value="${i.minPrice}" step="50">
                            <span class="sf-dash">–</span>
                            <input type="number" id="sf-max-price" class="sf-input sf-price" placeholder="Max $" value="${i.maxPrice}" step="50">
                        </div>
                        <button class="sf-more-btn-inline" id="sf-more-btn">
                            <i class="fa-solid fa-sliders"></i> Filters
                        </button>
                    </div>
                    <!-- Row 2: Type Chips -->
                    <div class="sf-row sf-row-chips">
                        <div class="sf-chips" id="sf-type-chips">
                            <button class="sf-chip ${i.type==="all"?"active":""}" data-type="all">All</button>
                            <button class="sf-chip ${i.type==="room"?"active":""}" data-type="room">Room</button>
                            <button class="sf-chip ${i.type==="apartment"?"active":""}" data-type="apartment">Apartment</button>
                            <button class="sf-chip ${i.type==="sublet"?"active":""}" data-type="sublet">Sublet</button>
                            <button class="sf-chip ${i.type==="roommate_wanted"?"active":""}" data-type="roommate_wanted">Roommate</button>
                        </div>
                    </div>
                </div>
                
                <!-- Expanded More Filters Panel -->
                <div class="sf-more-panel" id="sf-more-panel" style="display:none;">
                    <div class="sf-more-grid">
                        <div class="sf-more-col">
                            <h4>Duration</h4>
                            <label><input type="radio" name="sf-dur" value="all" ${i.dur==="all"?"checked":""}> Any Duration</label>
                            <label><input type="radio" name="sf-dur" value="short" ${i.dur==="short"?"checked":""}> Short (<3mo)</label>
                            <label><input type="radio" name="sf-dur" value="medium" ${i.dur==="medium"?"checked":""}> Medium (3-6mo)</label>
                            <label><input type="radio" name="sf-dur" value="long" ${i.dur==="long"?"checked":""}> Long (6mo+)</label>
                            <label><input type="radio" name="sf-dur" value="flexible" ${i.dur==="flexible"?"checked":""}> Flexible</label>
                        </div>
                        <div class="sf-more-col">
                            <h4>Furnished</h4>
                            <label><input type="radio" name="sf-furn" value="all" ${i.furn==="all"?"checked":""}> Any</label>
                            <label><input type="radio" name="sf-furn" value="yes" ${i.furn==="yes"?"checked":""}> Yes</label>
                            <label><input type="radio" name="sf-furn" value="no" ${i.furn==="no"?"checked":""}> No</label>
                            <label><input type="radio" name="sf-furn" value="partial" ${i.furn==="partial"?"checked":""}> Partial</label>
                        </div>
                        <div class="sf-more-col">
                            <h4>Amenities</h4>
                            <label><input type="checkbox" class="sf-amenity" value="amen_wifi" ${i.amenities.includes("amen_wifi")?"checked":""}> WiFi</label>
                            <label><input type="checkbox" class="sf-amenity" value="amen_laundry" ${i.amenities.includes("amen_laundry")?"checked":""}> In-unit Laundry</label>
                            <label><input type="checkbox" class="sf-amenity" value="amen_gym" ${i.amenities.includes("amen_gym")?"checked":""}> Gym</label>
                            <label><input type="checkbox" class="sf-amenity" value="amen_ac" ${i.amenities.includes("amen_ac")?"checked":""}> AC</label>
                            <label><input type="checkbox" class="sf-amenity" value="amen_parking" ${i.amenities.includes("amen_parking")?"checked":""}> Parking</label>
                        </div>
                        <div class="sf-more-col">
                            <h4>Trust & Safety</h4>
                            <label class="toggle-switch-label">
                                <input type="checkbox" id="sf-verified" ${i.verified?"checked":""}>
                                Verified Users Only
                            </label>
                        </div>
                    </div>
                </div>

                <div class="search-results-list" id="search-list-container">
                    <div class="s-results-header">
                        <div class="s-results-header-inner">
                            <div>
                                <h2 id="s-city-title">Search Results</h2>
                                <span class="s-results-count" id="s-results-count">Loading results...</span>
                            </div>
                            <select id="sf-sort" class="sf-sort-dropdown">
                                <option value="newest" ${i.sort==="newest"?"selected":""}>Newest</option>
                                <option value="price_asc" ${i.sort==="price_asc"?"selected":""}>Price: Low → High</option>
                                <option value="price_desc" ${i.sort==="price_desc"?"selected":""}>Price: High → Low</option>
                            </select>
                        </div>
                    </div>
                    <div class="s-grid" id="search-grid">
                        <div class="search-loading">Loading listings...</div>
                    </div>
                </div>
            </div>
            <div class="search-map-panel">
                <div id="search-map" class="search-map"></div>
            </div>
            <button class="btn btn-primary map-toggle-btn mobile-only shadow-lg" id="map-toggle-btn">
                <i class="fa-solid fa-map"></i> Map
            </button>
        </div>
    `;let n=!1;const l=e.querySelector("#map-toggle-btn"),d=e.querySelector(".search-layout"),v=e.querySelector("#search-grid");v.addEventListener("click",_=>{const $=_.target.closest(".s-card-fav");if($){_.preventDefault(),_.stopPropagation();const E=$.closest(".s-card").dataset.id,T=ee();if(!T){X("/auth/login");return}const j=u.users.findById(T.id);if(!j)return;j.saved_listings||(j.saved_listings=[]);const M=j.saved_listings.indexOf(E);M>-1?(j.saved_listings.splice(M,1),$.innerHTML='<i class="fa-regular fa-heart"></i>',$.classList.remove("active")):(j.saved_listings.push(E),$.innerHTML='<i class="fa-solid fa-heart" style="color:#1a1a1a;"></i>',$.classList.add("active")),u.users.update(T.id,{saved_listings:j.saved_listings})}});const b=u.listings.find(_=>_.status==="active");b.length===0?v.innerHTML='<div class="s-empty">No results found for these filters.</div>':v.innerHTML=b.map(Bt).join(""),l&&l.addEventListener("click",()=>{n=!n,d.classList.toggle("show-map",n),l.innerHTML=n?'<i class="fa-solid fa-list"></i> List':'<i class="fa-solid fa-map"></i> Map'});let y,g,f={};function h(_){if(!y||!window.L||(g?g.clearLayers():g=L.layerGroup().addTo(y),f={},_.length===0))return;const $=L.latLngBounds();_.forEach(E=>{if(!E.latitude||!E.longitude)return;const T=L.divIcon({className:"custom-map-marker",html:`<div class="map-price-marker">$${E.price}</div>`,iconSize:[50,24],iconAnchor:[25,24]}),j=L.marker([E.latitude,E.longitude],{icon:T}).addTo(g);$.extend([E.latitude,E.longitude]),f[E.listing_id]=j,j.bindPopup(`
                <div class="map-popup-card">
                    <img src="${E.photos&&E.photos[0]||"https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=300"}" alt="">
                    <div class="map-popup-body">
                        <strong>$${E.price}/mo</strong>
                        <div>${E.title.substring(0,30)}...</div>
                    </div>
                </div>
            `,{minWidth:200})}),Object.keys(f).length>0&&y.fitBounds($,{padding:[50,50],maxZoom:14})}function c(_,$){if(!(!y||!window.L)){if(_&&_!=="all"){const E=u.cities.findOne(T=>T.slug===_);if(E&&E.latitude&&E.longitude){y.setView([E.latitude,E.longitude],12);return}}if($&&$!=="all"){const E=s.filter(T=>T.country===$&&T.latitude&&T.longitude);if(E.length>0){const T=E.reduce((M,R)=>M+R.latitude,0)/E.length,j=E.reduce((M,R)=>M+R.longitude,0)/E.length;y.setView([T,j],5);return}}y.setView([20,0],2)}}setTimeout(()=>{if(document.getElementById("search-map")&&window.L){const $=i.city!=="all"?u.cities.findOne(M=>M.slug===i.city):null,E=$?.latitude||20,T=$?.longitude||0,j=$?12:2;y=L.map("search-map").setView([E,T],j),L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",{attribution:"&copy; OpenStreetMap contributors"}).addTo(y),m()}},100);function m(){const _=e.querySelector("#sf-country").value,$=e.querySelector("#sf-city").value,E=e.querySelector(".sf-chip.active")?.dataset.type||"all",T=e.querySelector("#sf-min-price").value,j=e.querySelector("#sf-max-price").value,M=e.querySelector("#sf-sort").value,R=e.querySelector('input[name="sf-dur"]:checked')?.value||"all",F=e.querySelector('input[name="sf-furn"]:checked')?.value||"all",H=e.querySelector("#sf-verified").checked,x=Array.from(e.querySelectorAll(".sf-amenity:checked")).map(z=>z.value),O=new URLSearchParams;_!=="all"&&O.set("country",_),$!=="all"&&O.set("city",$),E!=="all"&&O.set("type",E),T&&O.set("minPrice",T),j&&O.set("maxPrice",j),M!=="newest"&&O.set("sort",M),R!=="all"&&O.set("dur",R),F!=="all"&&O.set("furn",F),H&&O.set("verified","true"),x.length>0&&O.set("amenities",x.join(","));const pe="/search/rooms?"+O.toString();window.location.pathname+window.location.search!==pe&&X(pe);let J=u.listings.find(z=>z.status==="active");if($!=="all"){const z=u.cities.findOne(N=>N.slug===$);z?J=J.filter(N=>N.city===z.city_id):J=[]}else if(_!=="all"){const z=s.filter(N=>N.country===_).map(N=>N.city_id);J=J.filter(N=>z.includes(N.city))}E!=="all"&&(J=J.filter(z=>E==="room"?z.category==="room"||z.category==="room_rental"||z.room_type==="private":z.category===E||z.room_type===E)),T&&(J=J.filter(z=>z.price>=parseInt(T,10))),j&&(J=J.filter(z=>z.price<=parseInt(j,10))),R!=="all"&&(J=J.filter(z=>z.duration===R)),F!=="all"&&(J=J.filter(z=>z.furnished===F)),x.length>0&&(J=J.filter(z=>z.amenities?x.every(N=>z.amenities.includes(N)):!1)),H&&(J=J.filter(z=>{let N=z.user_details||u.users.findById(z.user_id);return N&&N.verification_level!=="none"})),M==="price_asc"?J.sort((z,N)=>z.price-N.price):M==="price_desc"?J.sort((z,N)=>N.price-z.price):J.sort((z,N)=>new Date(N.created_at)-new Date(z.created_at));const ue=e.querySelector("#search-grid");J.length===0?ue.innerHTML='<div class="s-empty">No results found for these filters.</div>':ue.innerHTML=J.map(Bt).join("");const xe=e.querySelector("#s-results-count"),me=e.querySelector("#s-city-title");if($!=="all"){const z=u.cities.findOne(N=>N.slug===$);if(z){const N=u.countries.findById(z.country);me.textContent=N?z.name+", "+N.name:z.name}else me.textContent="Search Results"}else if(_!=="all"){const z=u.countries.findById(_);me.textContent=z?z.flag_emoji+" "+z.name:"Search Results"}else me.textContent="All Locations";xe.textContent=`Showing ${J.length} results`;const re=[];$!=="all"?re.push($):_!=="all"&&re.push(_),E!=="all"&&re.push(E);const we=re.join(" ")||"all rooms";si(we,J.length),c($,_),h(J),e.querySelectorAll(".s-card").forEach(z=>{z.addEventListener("mouseenter",()=>{const N=z.dataset.id,ne=f[N];if(ne){const de=ne.getElement();de&&de.classList.add("marker-hover"),ne.setZIndexOffset(1e3)}}),z.addEventListener("mouseleave",()=>{const N=z.dataset.id,ne=f[N];if(ne){const de=ne.getElement();de&&de.classList.remove("marker-hover"),ne.setZIndexOffset(0)}})})}e.querySelector("#sf-country").addEventListener("change",()=>{const _=e.querySelector("#sf-country").value,$=_!=="all"?s.filter(j=>j.country===_):s,E=e.querySelector("#sf-city"),T=E.value;E.innerHTML='<option value="all">Anywhere</option>'+$.map(j=>`<option value="${j.slug}" ${T===j.slug?"selected":""}>${j.name}</option>`).join(""),m()}),e.querySelector("#sf-city").addEventListener("change",m),e.querySelector("#sf-sort").addEventListener("change",m);let p;const r=()=>{clearTimeout(p),p=setTimeout(m,400)};e.querySelector("#sf-min-price").addEventListener("input",r),e.querySelector("#sf-max-price").addEventListener("input",r);const w=e.querySelectorAll(".sf-chip");w.forEach(_=>{_.addEventListener("click",$=>{w.forEach(E=>E.classList.remove("active")),$.target.classList.add("active"),m()})}),m();const S=e.querySelector("#sf-more-btn"),A=e.querySelector("#sf-more-panel");S.addEventListener("click",()=>{const _=A.style.display==="none";A.style.display=_?"block":"none",S.classList.toggle("active",_)}),ce(),e.querySelectorAll('input[name="sf-dur"]').forEach(_=>_.addEventListener("change",m)),e.querySelectorAll('input[name="sf-furn"]').forEach(_=>_.addEventListener("change",m)),e.querySelectorAll(".sf-amenity").forEach(_=>_.addEventListener("change",m)),e.querySelector("#sf-verified").addEventListener("change",m)}function Kt(){try{const e=u.categories.findAll();if(e&&e.length>0)return["All",...e.map(t=>t.name)]}catch(e){console.warn("Error reading categories from db.categories",e)}return["All","City Guides","Roommate Tips","Market Reports","Moving Guides","Student Housing"]}Kt();function gt(){try{const e=u.posts.findAll();if(e&&e.length>0)return e}catch(e){console.warn("Error reading blogs from db.posts",e)}return[]}function Ta(e){return gt().find(t=>t.slug===e)}function Ia(e){const t=e.author||{};return{...e,_image:e.featured_image||e.image||"https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=1200",_date:e.published_date||e.date||"",_readTime:e.readTime||"3 min read",_authorName:t.name||e.author_name||"RoommateGroups",_authorAvatar:t.avatar||e.author_avatar||`https://i.pravatar.cc/150?u=${encodeURIComponent(t.name||"rg")}`,_authorBio:t.bio||e.author_bio||""}}function Ma(e){const t=gt().filter(n=>n.is_published!==!1&&n.status!=="draft").map(Ia),a=Kt();let i="All";function s(){const n=i==="All"?t:t.filter(d=>d.category===i),l=e.querySelector(".blog-grid");if(l){if(n.length===0){l.innerHTML='<div style="grid-column: 1/-1; text-align: center; padding: 4rem; background: white; border-radius: 12px; border: 1px solid var(--border); color: var(--text-secondary);">No posts found in this category.</div>';return}l.innerHTML=n.map(d=>`
            <article class="blog-card" onclick="navigate('/blog/${d.slug}')">
                <div class="card-image">
                    <img src="${d._image}" alt="${d.title}" loading="lazy" />
                    <span class="category-badge">${d.category||"General"}</span>
                </div>
                <div class="card-content">
                    <h3 class="card-title">${d.title}</h3>
                    <p class="card-excerpt">${d.excerpt||""}</p>
                    
                    <div class="card-meta">
                        <div class="author-info">
                            <img src="${d._authorAvatar}" alt="${d._authorName}" class="author-avatar" />
                            <span class="author-name">${d._authorName}</span>
                        </div>
                        <div class="post-stats">
                            <span><i class="far fa-calendar"></i> ${d._date?new Date(d._date).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}):d.date}</span>
                            <span><i class="far fa-clock"></i> ${d._readTime}</span>
                        </div>
                    </div>
                </div>
            </article>
        `).join("")}}e.innerHTML=`
        ${se()}

        <main class="blog-page">
            <section class="blog-hero">
                <div class="container hero-content">
                    <h1 style="color: #1a1a1a">RoommateGroups Blog</h1>
                    <p class="subtitle">Tips, guides, and market insights for renters and roommates</p>
                </div>
            </section>

            <section class="blog-main-container container">
                <div class="blog-content-area">
                    <div class="blog-categories">
                        ${a.map(n=>`<button class="category-tab ${n===i?"active":""}" data-category="${n}">${n}</button>`).join("")}
                    </div>

                    <div class="blog-grid">
                        <!-- Grid items loaded by renderGrid() -->
                    </div>

                    <div class="load-more-container" style="display: none;">
                        <button class="btn btn-primary load-more-btn">Load More Posts</button>
                    </div>
                </div>
            </section>
        </main>
        ${ge()}

        <style>
            .blog-page {
                background: var(--bg-light);
                min-height: 100vh;
                padding-bottom: 60px;
                margin-top: 70px;
            }
            .blog-hero {
                background: #f2f2f2;
                color: #1a1a1a;
                padding: 100px 20px;
                text-align: center;
                margin-bottom: 60px;
                border-bottom: 1px solid #e2e8f0;
            }
            .blog-hero h1 {
                font-size: 3.5rem;
                font-weight: 800;
                margin-bottom: 1rem;
                letter-spacing: -1px;
            }
            .blog-hero .subtitle {
                font-size: 1.25rem;
                opacity: 0.95;
                max-width: 600px;
                margin: 0 auto;
            }
            .blog-main-container {
                max-width: 1200px;
                margin: 0 auto;
                padding: 0 20px;
            }
            .blog-categories {
                display: flex;
                gap: 12px;
                margin-bottom: 40px;
                flex-wrap: wrap;
                justify-content: center;
            }
            .category-tab {
                padding: 10px 24px;
                border: 1px solid var(--border);
                background: white;
                color: var(--text-secondary);
                border-radius: 30px;
                cursor: pointer;
                transition: all 0.2s;
                font-weight: 600;
                font-size: 0.9rem;
            }
            .category-tab:hover {
                border-color: var(--primary);
                color: var(--primary);
                background: var(--bg-light);
            }
            .category-tab.active {
                background: var(--primary);
                color: white;
                border-color: var(--primary);
                box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
            }
            .blog-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
                gap: 32px;
                margin-bottom: 60px;
            }
            .blog-card {
                background: white;
                border-radius: 16px;
                overflow: hidden;
                box-shadow: 0 4px 20px rgba(0,0,0,0.05);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                cursor: pointer;
                border: 1px solid var(--border);
                display: flex;
                flex-direction: column;
            }
            .blog-card:hover {
                transform: translateY(-8px);
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                border-color: var(--primary-light);
            }
            .card-image {
                position: relative;
                height: 220px;
                overflow: hidden;
            }
            .card-image img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                transition: transform 0.5s;
            }
            .blog-card:hover .card-image img {
                transform: scale(1.05);
            }
            .category-badge {
                position: absolute;
                top: 16px;
                left: 16px;
                background: var(--primary);
                color: white;
                padding: 6px 14px;
                border-radius: 20px;
                font-size: 0.75rem;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            }
            .card-content {
                padding: 24px;
                display: flex;
                flex-direction: column;
                flex: 1;
            }
            .card-title {
                font-size: 1.4rem;
                font-weight: 700;
                margin-bottom: 12px;
                line-height: 1.3;
                color: var(--text-primary);
            }
            .card-excerpt {
                color: var(--text-secondary);
                font-size: 1rem;
                line-height: 1.6;
                margin-bottom: 24px;
                display: -webkit-box;
                -webkit-line-clamp: 3;
                -webkit-box-orient: vertical;
                overflow: hidden;
            }
            .card-meta {
                margin-top: auto;
                padding-top: 20px;
                border-top: 1px solid var(--border);
                display: flex;
                align-items: center;
                justify-content: space-between;
            }
            .author-info {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .author-avatar {
                width: 36px;
                height: 36px;
                border-radius: 50%;
                object-fit: cover;
                border: 2px solid var(--border);
            }
            .author-name {
                font-weight: 700;
                font-size: 0.85rem;
                color: var(--text-primary);
            }
            .post-stats {
                display: flex;
                gap: 12px;
                color: var(--text-muted);
                font-size: 0.8rem;
                font-weight: 500;
            }
            .post-stats span i {
                margin-right: 4px;
            }
            @media (max-width: 768px) {
                .blog-hero h1 { font-size: 2.5rem; }
                .blog-grid { grid-template-columns: 1fr; }
            }
        </style>
    `,s();const o=e.querySelectorAll(".category-tab");o.forEach(n=>{n.addEventListener("click",l=>{o.forEach(d=>d.classList.remove("active")),n.classList.add("active"),i=n.dataset.category,s()})}),ce()}function ct(e){const t=e.author||{};return{...e,_image:e.featured_image||e.image||"",_date:e.published_date||e.date||"",_readTime:e.readTime||"",_authorName:t.name||e.author_name||"RoommateGroups",_authorAvatar:t.avatar||e.author_avatar||`https://i.pravatar.cc/150?u=${encodeURIComponent(t.name||"rg")}`,_authorBio:t.bio||e.author_bio||"",_tags:Array.isArray(e.tags)?e.tags:[]}}function Ba(e,t){const a=e.id||e.post_id,i=t.filter(n=>(n.id||n.post_id)!==a&&(n.category===e.category||n.category_id===e.category));if(i.length>=3)return i.slice(0,3);const s=ct(e)._tags,o=t.filter(n=>(n.id||n.post_id)===a||i.includes(n)?!1:(Array.isArray(n.tags)?n.tags:[]).some(d=>s.includes(d)));return[...i,...o].slice(0,3)}function Ra(e,t){const a=t.slug,i=Ta(a),s=i&&i.is_published!==!1&&i.status!=="draft"?i:null;if(!s){e.innerHTML=`
            ${se()}
            <main class="post-page" style="min-height: calc(100vh - 70px); display: flex; align-items: center; justify-content: center; padding: 40px 20px;">
                <div style="text-align:center; padding: 50px 40px; background: white; border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); border: 1px solid var(--border); max-width: 500px; width: 100%;">
                    <div style="width: 80px; height: 80px; background: var(--bg-light); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;">
                        <i class="far fa-file-alt" style="font-size: 2.2rem; color: var(--text-muted);"></i>
                    </div>
                    <h1 style="font-size: 2rem; font-weight: 800; color: var(--text-primary); margin-bottom: 12px;">Article Not Found</h1>
                    <p style="color: var(--text-secondary); line-height: 1.6; margin-bottom: 32px; font-size: 1.05rem;">The post you're looking for doesn't exist, has been removed, or the link may be broken.</p>
                    <button class="btn btn-primary" onclick="navigate('/blog')" style="width: 100%; padding: 14px; font-weight: 600;">
                        <i class="fas fa-arrow-left" style="margin-right: 8px;"></i> Return to Blog
                    </button>
                </div>
            </main>`;return}const o=ct(s);Da(o);const n=Ba(s,gt()),l=(()=>{if(!o._date)return"";try{return new Date(o._date).toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"})}catch{return o._date}})();e.innerHTML=`
        ${se()}

        <main class="post-page">

            <!-- ① Featured Image Hero -->
            <section class="post-hero">
                <div class="post-hero-img-wrap">
                    <img src="${o._image}" alt="${o.title}" class="post-hero-img" />
                    <div class="post-hero-overlay"></div>
                </div>
                <div class="container post-hero-content">
                    <nav class="post-breadcrumb" aria-label="breadcrumb">
                        <a href="/">Home</a> <span>/</span>
                        <a href="/blog">Blog</a> <span>/</span>
                        <span>${o.category||""}</span>
                    </nav>
                    <span class="category-badge big">${o.category||""}</span>
                    <!-- ② H1 Title -->
                    <h1 class="post-title">${o.title}</h1>
                    <!-- ② Meta: Author, Date, Read Time -->
                    <div class="post-meta-hero">
                        <div class="author-info">
                            <img src="${o._authorAvatar}" alt="${o._authorName}" class="author-avatar" />
                            <span class="author-name">${o._authorName}</span>
                        </div>
                        <div class="post-stats-hero">
                            ${l?`<span><i class="far fa-calendar"></i> ${l}</span>`:""}
                            ${o._readTime?`<span class="dot-separator">•</span><span><i class="far fa-clock"></i> ${o._readTime}</span>`:""}
                        </div>
                    </div>
                </div>
            </section>

            <!-- ③ Main Content Grid -->
            <section class="post-main-container container">

                <article class="post-content-area prose" id="post-article">
                    <!-- ③ Rich Text Content -->
                    ${o.content||""}

                    <!-- Tags -->
                    ${o._tags.length>0?`
                    <div class="post-tags">
                        <i class="fas fa-tags"></i>
                        ${o._tags.map(d=>`<span class="tag-pill">${d}</span>`).join("")}
                    </div>`:""}

                    <!-- ⑥ Social Share Buttons -->
                    <div class="social-share">
                        <h4>Share this article</h4>
                        <div class="share-buttons">
                            <button class="share-btn twitter" id="share-twitter">
                                <i class="fab fa-twitter"></i> Twitter
                            </button>
                            <button class="share-btn facebook" id="share-facebook">
                                <i class="fab fa-facebook-f"></i> Facebook
                            </button>
                            <button class="share-btn linkedin" id="share-linkedin">
                                <i class="fab fa-linkedin-in"></i> LinkedIn
                            </button>
                            <button class="share-btn copy-link" id="share-copy">
                                <i class="fas fa-link"></i> Copy Link
                            </button>
                        </div>
                    </div>

                    <!-- ⑦ CTA Banner -->
                    <div class="cta-inline-banner">
                        <div class="cta-inline-content">
                            <div class="cta-inline-text">
                                <h3>${o.ctaHeading||"Ready to Find Your Next Room?"}</h3>
                                <p>Browse thousands of verified rooms and roommate listings across the US.</p>
                            </div>
                            <button class="btn btn-primary cta-inline-btn" onclick="navigate('${o.ctaBtnLink||"/search/rooms"}')">
                                ${o.ctaBtnText||"Find a Room"} <i class="fas fa-arrow-right"></i>
                            </button>
                        </div>
                    </div>

                    <!-- ⑤ Author Bio Card -->
                    <div class="author-bio-card">
                        <img src="${o._authorAvatar}" alt="${o._authorName}" class="bio-avatar" />
                        <div class="bio-content">
                            <h4>About ${o._authorName}</h4>
                            <p>${o._authorBio||"Contributing writer at RoommateGroups."}</p>
                        </div>
                    </div>
                </article>

            </section>

            <!-- ⑧ Related Posts -->
            ${n.length>0?`
            <section class="related-posts-section">
                <div class="container">
                    <h2 class="section-title">More Like This</h2>
                    <div class="related-grid">
                        ${n.map(d=>{const v=ct(d);return`
                            <article class="related-card" onclick="navigate('/blog/${d.slug}')">
                                <div class="related-card-img">
                                    <img src="${v._image}" alt="${d.title}" loading="lazy" />
                                    <span class="rc-badge">${d.category||""}</span>
                                </div>
                                <div class="related-card-body">
                                    <h3>${d.title}</h3>
                                    <p>${d.excerpt?d.excerpt.substring(0,80)+"…":""}</p>
                                    <span class="rc-read-more">Read article <i class="fas fa-arrow-right"></i></span>
                                </div>
                            </article>`}).join("")}
                    </div>
                </div>
            </section>`:""}

        </main>

        ${ge()}

        <style>
            /* ═══════════════════════════════════════
               POST PAGE LAYOUT
            ═══════════════════════════════════════ */
            .post-page {
                background: var(--bg-light);
                min-height: 100vh;
                margin-top: 70px;
            }

            /* ── Breadcrumb ── */
            .post-breadcrumb {
                display: flex;
                align-items: center;
                gap: 8px;
                color: rgba(255,255,255,0.75);
                font-size: 0.85rem;
                margin-bottom: 16px;
            }
            .post-breadcrumb a { color: rgba(255,255,255,0.75); text-decoration: none; }
            .post-breadcrumb a:hover { color: white; }
            .post-breadcrumb span { opacity: 0.5; }
            .post-breadcrumb span:last-child { opacity: 1; color: white; }

            /* ── Hero ── */
            .post-hero {
                position: relative;
                height: 55vh;
                min-height: 420px;
                max-height: 640px;
                display: flex;
                align-items: flex-end;
                color: white;
            }
            .post-hero-img-wrap {
                position: absolute;
                inset: 0;
                z-index: 1;
            }
            .post-hero-img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
            .post-hero-overlay {
                position: absolute;
                inset: 0;
                background: linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.82) 100%);
            }
            .post-hero-content {
                position: relative;
                z-index: 2;
                padding-bottom: 52px;
            }
            .category-badge.big {
                background: var(--primary);
                color: white;
                font-size: 0.82rem;
                font-weight: 700;
                letter-spacing: 0.8px;
                text-transform: uppercase;
                padding: 6px 16px;
                border-radius: 30px;
                display: inline-block;
                margin-bottom: 16px;
            }
            .post-title {
                font-size: clamp(2rem, 5vw, 3.5rem);
                font-weight: 800;
                line-height: 1.15;
                margin-bottom: 24px;
                max-width: 900px;
                text-shadow: 0 2px 12px rgba(0,0,0,0.5);
            }
            .post-meta-hero {
                display: flex;
                align-items: center;
                gap: 20px;
                flex-wrap: wrap;
            }
            .post-meta-hero .author-info {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .post-meta-hero .author-avatar {
                width: 44px;
                height: 44px;
                border-radius: 50%;
                border: 2px solid rgba(255,255,255,0.7);
                object-fit: cover;
            }
            .post-meta-hero .author-name { font-weight: 600; font-size: 1rem; }
            .post-stats-hero {
                display: flex;
                align-items: center;
                gap: 10px;
                font-size: 0.9rem;
                opacity: 0.85;
            }
            .dot-separator { opacity: 0.5; }

            /* ── Main Grid ── */
            .post-main-container {
                display: block;
                max-width: 900px;
                margin: 0 auto;
                padding: 40px 20px;
            }

    /* ═══════════════════════════════════════
       PROSE / RICH TEXT  ← KEY ADDITION
    ═══════════════════════════════════════ */
    .prose {
        background: white;
        padding: 50px;
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow);
        border: 1px solid var(--border);
        line-height: 1.7;
        font-size: 1.05rem;
    }
    @media (max-width: 768px) { .prose { padding: 22px; } }

            .prose p { margin-bottom: 1.5em; color: #1a1a1a; }
            .prose .lead {
                font-size: 1.25rem;
                line-height: 1.7;
                color: var(--text-primary);
                font-weight: 500;
                margin-bottom: 2em;
            }
            .prose h2 {
                font-size: 1.85rem;
                font-weight: 700;
                color: var(--text-primary);
                margin-top: 2.5em;
                margin-bottom: 0.75em;
            }

            .prose h3 {
                font-size: 1.7rem;
                font-weight: 600;
                margin-top: 2em;
                margin-bottom: 1em;
                color: var(--text-primary);
                line-height: 1.4;
            }
            .prose h4 {
                font-size: 1.1rem;
                font-weight: 700;
                color: var(--text-primary);
                margin-top: 1.5em;
                margin-bottom: 0.4em;
            }
            .prose ul, .prose ol {
                margin: 1.5em 0;
                padding-left: 1.5em;
            }
            .prose li { margin-bottom: 0.6em; line-height: 1.6; }
            .prose strong { color: var(--text-primary); }
            .prose a { color: var(--primary); text-decoration: underline; }
            .prose a:hover { opacity: 0.8; }

            /* Blockquote */
            .prose blockquote {
                border-left: 4px solid var(--primary);
                padding: 1em 1.5em;
                margin: 1.5em 0;
                background: var(--bg-light);
                border-radius: 0 var(--radius);
                font-style: italic;
                color: var(--text-secondary);
                border-radius: 0 10px 10px 0;
            }
            .prose blockquote p { margin: 0; color: inherit; }

            /* Images */
            .prose img {
                width: 100%;
                border-radius: var(--radius);
                margin: 2em 0;
                box-shadow: var(--shadow-sm);
                display: block;
            }
            .prose figure { margin: 2em 0; }
            .prose figcaption {
                text-align: center;
                font-size: 0.875rem;
                color: var(--text-secondary);
                margin-top: -1em;
                margin-bottom: 1em;
            }

            /* ── Embedded Videos (iframe / video) ── */
            .prose iframe,
            .prose video {
                width: 100%;
                aspect-ratio: 16 / 9;
                border-radius: var(--radius);
                margin: 2em 0;
                border: none;
                display: block;
            }
            .prose .video-wrapper {
                position: relative;
                padding-bottom: 56.25%;
                height: 0;
                overflow: hidden;
                border-radius: var(--radius);
                margin: 2em 0;
            }
            .prose .video-wrapper iframe,
            .prose .video-wrapper video {
                position: absolute;
                inset: 0;
                width: 100%;
                height: 100%;
                margin: 0;
                border-radius: 0;
            }

            /* ── Tables ── */
            .prose table {
                width: 100%;
                border-collapse: collapse;
                margin: 2em 0;
                font-size: 0.95rem;
                border-radius: var(--radius);
                overflow: hidden;
                box-shadow: var(--shadow-sm);
            }
            .prose table thead {
                background: var(--primary);
                color: white;
            }
            .prose table thead th {
                padding: 14px 18px;
                text-align: left;
                font-weight: 700;
                font-size: 0.875rem;
                letter-spacing: 0.5px;
                text-transform: uppercase;
            }
            .prose table tbody tr {
                border-bottom: 1px solid var(--border);
                transition: background 0.15s;
            }
            .prose table tbody tr:hover { background: var(--bg-light); }
            .prose table tbody tr:last-child { border-bottom: none; }
            .prose table td {
                padding: 12px 18px;
                color: #1a1a1a;
                vertical-align: top;
            }

            /* ── Code Blocks ── */
            .prose code {
                background: #1e293b;
                color: #e2e8f0;
                padding: 2px 8px;
                border-radius: 5px;
                font-family: 'Fira Code', 'Consolas', monospace;
                font-size: 0.88em;
                white-space: nowrap;
            }
            .prose pre {
                background: #0f172a;
                color: #e2e8f0;
                padding: 28px;
                border-radius: var(--radius);
                overflow-x: auto;
                margin: 2em 0;
                font-family: 'Fira Code', 'Consolas', monospace;
                font-size: 0.9rem;
                line-height: 1.7;
                border: 1px solid #1a1a1a;
                position: relative;
            }
            .prose pre code {
                background: none;
                color: inherit;
                padding: 0;
                border-radius: 0;
                font-size: inherit;
                white-space: pre;
            }
            /* Language label on code blocks */
            .prose pre[data-lang]::before {
                content: attr(data-lang);
                position: absolute;
                top: 10px;
                right: 14px;
                font-size: 0.7rem;
                text-transform: uppercase;
                color: #64748b;
                letter-spacing: 1px;
                font-family: sans-serif;
            }

            /* Horizontal Rule */
            .prose hr {
                border: none;
                border-top: 2px solid var(--border);
                margin: 3em 0;
            }

            /* ── Tags ── */
            .post-tags {
                display: flex;
                align-items: center;
                gap: 10px;
                flex-wrap: wrap;
                margin: 40px 0 10px;
                padding-top: 24px;
                border-top: 1px solid var(--border);
                color: var(--text-secondary);
                font-size: 0.9rem;
            }
            .tag-pill {
                background: var(--bg-light);
                border: 1px solid var(--border);
                padding: 4px 14px;
                border-radius: 30px;
                font-size: 0.82rem;
                color: var(--text-secondary);
                cursor: pointer;
                transition: all 0.2s;
            }
            .tag-pill:hover {
                background: var(--primary);
                color: white;
                border-color: var(--primary);
            }

            /* ── Social Share ── */
            .social-share {
                margin-top: 40px;
                padding-top: 28px;
                border-top: 1px solid var(--border);
            }
            .social-share h4 { font-size: 1rem; margin-bottom: 14px; color: var(--text-primary); }
            .share-buttons { display: flex; gap: 12px; flex-wrap: wrap; }
            .share-btn {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 10px 20px;
                border-radius: 30px;
                border: none;
                font-weight: 600;
                font-size: 0.9rem;
                cursor: pointer;
                transition: all 0.2s;
                color: white;
                text-decoration: none;
            }
            .share-btn.twitter  { background: #1a1a1a; }
            .share-btn.facebook { background: #1a1a1a; }
            .share-btn.linkedin { background: #1a1a1a; }
            .share-btn.copy-link {
                background: var(--bg-light);
                color: var(--text-primary);
                border: 1px solid var(--border);
            }
            .share-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
            .share-btn.copy-link:hover { background: var(--border); }

            /* ── Inline CTA Banner ── */
            .cta-inline-banner {
                background: linear-gradient(135deg, var(--primary) 0%, #333333 100%);
                border-radius: var(--radius-lg);
                padding: 36px 40px;
                margin: 48px 0;
                color: white;
            }
            .cta-inline-content {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 24px;
                flex-wrap: wrap;
            }
            .cta-inline-text h3 {
                font-size: 1.4rem;
                font-weight: 800;
                margin-bottom: 8px;
            }
            .cta-inline-text p {
                font-size: 0.95rem;
                opacity: 0.9;
                margin: 0;
                color: white;
            }
            .cta-inline-btn {
                background: white;
                color: var(--primary);
                font-weight: 700;
                padding: 14px 28px;
                border-radius: 30px;
                white-space: nowrap;
                flex-shrink: 0;
                border: none;
                cursor: pointer;
                font-size: 1rem;
                transition: all 0.2s;
            }
            .cta-inline-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(0,0,0,0.25);
            }
            @media (max-width: 600px) {
                .cta-inline-banner { padding: 28px 22px; }
                .cta-inline-content { flex-direction: column; align-items: flex-start; }
            }

            /* ── Author Bio ── */
            .author-bio-card {
                display: flex;
                gap: 22px;
                background: var(--bg-light);
                padding: 30px;
                border-radius: var(--radius-lg);
                border: 1px solid var(--border);
                margin-top: 16px;
            }
            .bio-avatar {
                width: 84px;
                height: 84px;
                border-radius: 50%;
                object-fit: cover;
                flex-shrink: 0;
                border: 3px solid var(--border);
            }
            .bio-content h4 { font-size: 1.15rem; margin-bottom: 8px; color: var(--text-primary); }
            .bio-content p { font-size: 0.95rem; line-height: 1.6; color: var(--text-secondary); margin: 0; }
            @media (max-width: 600px) {
                .author-bio-card { flex-direction: column; align-items: center; text-align: center; }
            }

            /* ── Sidebar ── */
            .sticky-sidebar {
                position: sticky;
                top: 100px;
                display: flex;
                flex-direction: column;
                gap: 24px;
            }
            .sidebar-widget {
                background: white;
                border-radius: var(--radius-lg);
                padding: 22px;
                box-shadow: var(--shadow-sm);
                border: 1px solid var(--border);
            }
            .sidebar-widget h3 {
                font-size: 0.8rem;
                color: var(--text-secondary);
                margin-bottom: 16px;
                padding-bottom: 12px;
                border-bottom: 1px solid var(--border);
                text-transform: uppercase;
                letter-spacing: 1px;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            /* TOC */
            .toc-nav ul { list-style: none; padding: 0; margin: 0; }
            .toc-nav li { margin-bottom: 2px; }

            /* H2 items */
            .toc-nav li.toc-h2 > a {
                color: var(--text-secondary);
                text-decoration: none;
                font-size: 0.9rem;
                display: block;
                padding: 5px 10px;
                border-radius: 6px;
                line-height: 1.4;
                transition: all 0.15s;
                border-left: 2px solid transparent;
            }
            /* H3 items — indented */
            .toc-nav li.toc-h3 > a {
                color: var(--text-secondary);
                text-decoration: none;
                font-size: 0.82rem;
                display: block;
                padding: 4px 10px 4px 22px;
                border-radius: 6px;
                line-height: 1.4;
                transition: all 0.15s;
                border-left: 2px solid transparent;
                opacity: 0.8;
            }
            .toc-nav a:hover {
                color: var(--primary);
                background: var(--bg-light);
                border-left-color: var(--primary);
            }
            .toc-nav a.active {
                color: var(--primary);
                background: var(--primary-ghost, #f5f5f5);
                border-left-color: var(--primary);
                font-weight: 600;
            }

            /* CTA widget */
            .cta-widget {
                background: linear-gradient(135deg, var(--bg-light) 0%, white 100%);
                border-top: 3px solid var(--primary);
            }
            .cta-widget h3 { color: var(--primary); border-bottom: none; padding: 0; margin-bottom: 8px; }
            .cta-widget p { color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 16px; line-height: 1.5; }

            /* ── Related Posts ── */
            .related-posts-section {
                padding: 72px 0 90px;
                background: white;
                border-top: 1px solid var(--border);
            }
            .section-title {
                font-size: 2rem;
                font-weight: 800;
                text-align: center;
                margin-bottom: 48px;
                color: var(--text-primary);
            }
            .related-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                gap: 28px;
            }
            .related-card {
                border-radius: var(--radius-lg);
                overflow: hidden;
                background: white;
                border: 1px solid var(--border);
                box-shadow: var(--shadow-sm);
                cursor: pointer;
                transition: all 0.25s;
            }
            .related-card:hover {
                transform: translateY(-4px);
                box-shadow: 0 12px 32px rgba(0,0,0,0.12);
            }
            .related-card-img {
                position: relative;
                height: 190px;
                overflow: hidden;
            }
            .related-card-img img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                transition: transform 0.4s;
            }
            .related-card:hover .related-card-img img { transform: scale(1.05); }
            .rc-badge {
                position: absolute;
                top: 14px;
                left: 14px;
                background: var(--primary);
                color: white;
                font-size: 0.72rem;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.8px;
                padding: 4px 10px;
                border-radius: 20px;
            }
            .related-card-body { padding: 20px; }
            .related-card-body h3 {
                font-size: 1.05rem;
                font-weight: 700;
                color: var(--text-primary);
                margin-bottom: 8px;
                line-height: 1.4;
            }
            .related-card-body p {
                font-size: 0.875rem;
                color: var(--text-secondary);
                margin-bottom: 14px;
                line-height: 1.5;
            }
            .rc-read-more {
                font-size: 0.85rem;
                font-weight: 600;
                color: var(--primary);
                display: flex;
                align-items: center;
                gap: 6px;
            }
        </style>
    `,setTimeout(()=>{Pa(),ja(o),za(),ce()},100)}function Pa(){const e=document.getElementById("post-article"),t=document.getElementById("toc-list"),a=document.getElementById("toc-widget");if(!e||!t)return;const i=e.querySelectorAll("h2, h3");if(i.length===0){a&&(a.style.display="none");return}i.forEach((s,o)=>{const n=`h-${o}`;s.id=n;const l=document.createElement("li");l.classList.add(s.tagName==="H2"?"toc-h2":"toc-h3");const d=document.createElement("a");d.href="#"+n,d.textContent=s.textContent.trim(),d.addEventListener("click",v=>{v.preventDefault(),s.scrollIntoView({behavior:"smooth",block:"start"}),document.querySelectorAll(".toc-nav a").forEach(b=>b.classList.remove("active")),d.classList.add("active")}),l.appendChild(d),t.appendChild(l)})}function za(){const e=document.getElementById("post-article");if(!e)return;const t=[...e.querySelectorAll("h2[id], h3[id]")];if(t.length===0)return;const a=new IntersectionObserver(i=>{i.forEach(s=>{if(s.isIntersecting){document.querySelectorAll(".toc-nav a").forEach(n=>n.classList.remove("active"));const o=document.querySelector(`.toc-nav a[href="#${s.target.id}"]`);o&&o.classList.add("active")}})},{rootMargin:"-80px 0px -60% 0px",threshold:0});t.forEach(i=>a.observe(i))}function ja(e){const t=encodeURIComponent(e.canonical_url||e.canonicalUrl||window.location.href),a=encodeURIComponent(e.title),i=(o,n)=>{const l=document.getElementById(o);l&&l.addEventListener("click",()=>window.open(n,"_blank","width=600,height=450,noopener"))};i("share-twitter",`https://twitter.com/intent/tweet?url=${t}&text=${a}`),i("share-facebook",`https://www.facebook.com/sharer/sharer.php?u=${t}`),i("share-linkedin",`https://www.linkedin.com/sharing/share-offsite/?url=${t}`);const s=document.getElementById("share-copy");s&&s.addEventListener("click",()=>{const o=e.canonical_url||e.canonicalUrl||window.location.href;navigator.clipboard.writeText(o).then(()=>{const n=s.innerHTML;s.innerHTML='<i class="fas fa-check"></i> Copied!',setTimeout(()=>{s.innerHTML=n},2e3)}).catch(()=>{const n=document.createElement("textarea");n.value=o,n.style.position="fixed",n.style.opacity="0",document.body.appendChild(n),n.select(),document.execCommand("copy"),document.body.removeChild(n);const l=s.innerHTML;s.innerHTML='<i class="fas fa-check"></i> Copied!',setTimeout(()=>{s.innerHTML=l},2e3)})})}function Da(e){const t=e.seoTitle||e.meta_title||`${e.title} | RoommateGroups Blog`,a=e.seoDescription||e.meta_description||e.excerpt,i=e.ogImage||e.og_image||e.featured_image||e.image,s=e.canonicalUrl||e.canonical_url||window.location.href,o=e.author?.name||e.author_name||"RoommateGroups",n=e.published_date||e.date;document.title=t;const l=(y,g,f="name")=>{if(!g)return;let h=document.querySelector(`meta[${f}="${y}"]`);h||(h=document.createElement("meta"),h.setAttribute(f,y),h.setAttribute("data-dynamic-seo","true"),document.head.appendChild(h)),h.setAttribute("content",g)};l("description",a),l("og:title",t,"property"),l("og:description",a,"property"),l("og:image",i,"property"),l("og:type","article","property"),l("og:url",s,"property"),l("twitter:card","summary_large_image"),l("twitter:title",t),l("twitter:description",a),l("twitter:image",i);let d=document.querySelector('link[rel="canonical"]');d||(d=document.createElement("link"),d.rel="canonical",d.setAttribute("data-dynamic-seo","true"),document.head.appendChild(d)),d.href=s;let v=document.getElementById("seo-schema");v||(v=document.createElement("script"),v.id="seo-schema",v.type="application/ld+json",document.head.appendChild(v));let b;try{b=n?new Date(n).toISOString():new Date().toISOString()}catch{b=new Date().toISOString()}e.schemaText?v.textContent=e.schemaText:v.textContent=JSON.stringify({"@context":"https://schema.org","@graph":[{"@type":"Article",headline:t,description:a,image:i,url:s,datePublished:b,author:{"@type":"Person",name:o},publisher:{"@type":"Organization",name:"RoommateGroups",logo:{"@type":"ImageObject",url:"https://roommategroups.com/logo.png"}}},{"@type":"BreadcrumbList",itemListElement:[{"@type":"ListItem",position:1,name:"Home",item:"https://roommategroups.com/"},{"@type":"ListItem",position:2,name:"Blog",item:"https://roommategroups.com/#/blog"},{"@type":"ListItem",position:3,name:e.title,item:s}]}]},null,2)}function Fa(e){e.innerHTML=`
    ${se()}
    <style>
        .about-hero { background: #f2f2f2; color: #1a1a1a; border-bottom: 1px solid #e2e8f0; padding: 100px 0 80px; text-align: center; }
        .about-hero h1 { font-size: clamp(2.2rem, 5vw, 3.5rem); font-weight: 800; margin-bottom: 20px; }
        .about-hero p { font-size: 1.2rem; opacity: 0.85; max-width: 600px; margin: 0 auto; }
        .about-section { padding: 80px 0; }
        .about-section.alt { background: #f8fafc; }
        .about-container { max-width: 1100px; margin: 0 auto; padding: 0 24px; }
        .about-mission { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; }
        .about-mission img { border-radius: 20px; width: 100%; object-fit: cover; }
        .about-mission h2 { font-size: 2rem; font-weight: 800; margin-bottom: 16px; color: #1a1a1a; }
        .about-mission p { color: #475569; line-height: 1.8; font-size: 1.05rem; }
        .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; margin-top: 60px; }
        .stat-card { text-align: center; padding: 32px 20px; background: white; border-radius: 16px; box-shadow: 0 4px 24px rgba(99,102,241,0.08); }
        .stat-card .num { font-size: 2.4rem; font-weight: 900; color: #1a1a1a; }
        .stat-card .label { font-size: 0.9rem; color: #64748b; margin-top: 4px; }
        .team-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 28px; margin-top: 48px; }
        .team-card { background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06); transition: transform 0.2s; }
        .team-card:hover { transform: translateY(-4px); }
        .team-card-avatar { height: 200px; display: flex; align-items: center; justify-content: center; font-size: 4rem; }
        .team-card-body { padding: 20px; text-align: center; }
        .team-card-body h3 { font-size: 1.1rem; font-weight: 700; margin-bottom: 4px; }
        .team-card-body p { font-size: 0.85rem; color: #64748b; }
        .values-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px; margin-top: 48px; }
        .value-card { padding: 28px; border-radius: 16px; background: white; box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
        .value-card .icon { width: 52px; height: 52px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; margin-bottom: 16px; }
        .value-card h3 { font-size: 1.1rem; font-weight: 700; margin-bottom: 8px; }
        .value-card p { color: #64748b; font-size: 0.92rem; line-height: 1.7; }
        .section-label { font-size: 0.85rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #1a1a1a; margin-bottom: 12px; }
        .section-title { font-size: clamp(1.6rem, 3vw, 2.2rem); font-weight: 800; color: #1a1a1a; margin-bottom: 16px; }
        .section-sub { color: #64748b; font-size: 1.05rem; max-width: 600px; }
        @media (max-width: 768px) {
            .about-mission { grid-template-columns: 1fr; }
            .stats-row { grid-template-columns: repeat(2, 1fr); }
        }
    </style>

    <div class="about-hero">
        <div class="about-container">
            <div class="section-label" style="color:rgba(167,139,250,1);margin-bottom:16px;">Our Story</div>
            <h1>Built for the Modern Renter</h1>
            <p>RoommateGroups was founded in 2018 with one mission: make finding a home and a great roommate simple, safe, and human.</p>
        </div>
    </div>

    <!-- Mission -->
    <section class="about-section">
        <div class="about-container">
            <div class="about-mission">
                <div>
                    <div class="section-label">Our Mission</div>
                    <h2>Making Home Finding Human Again</h2>
                    <p style="margin-bottom:16px;">We believe everyone deserves a safe, affordable, and fulfilling place to live. Whether you're a student moving to a new city, a young professional looking for your first apartment, or a host with a spare room — RoommateGroups connects real people with real homes.</p>
                    <p>Every feature we build is designed to reduce the stress, scams, and uncertainty in the rental process. Verified IDs, real reviews, and transparent pricing — because you deserve nothing less.</p>
                </div>
                <div style="background:linear-gradient(135deg,#1a1a1a,#444444);border-radius:20px;height:350px;display:flex;align-items:center;justify-content:center;font-size:5rem;color:white;">🏠</div>
            </div>

            <div class="stats-row">
                <div class="stat-card"><div class="num">1.5M+</div><div class="label">Community Members</div></div>
                <div class="stat-card"><div class="num">30+</div><div class="label">Cities Worldwide</div></div>
                <div class="stat-card"><div class="num">98%</div><div class="label">Scam-Free Listings</div></div>
                <div class="stat-card"><div class="num">4.9★</div><div class="label">Average App Rating</div></div>
            </div>
        </div>
    </section>

    <!-- Values -->
    <section class="about-section alt">
        <div class="about-container">
            <div class="section-label">What We Stand For</div>
            <div class="section-title">Our Core Values</div>
            <p class="section-sub">These aren't just words. They're the principles behind every decision we make.</p>
            <div class="values-grid">
                <div class="value-card">
                    <div class="icon" style="background:#f5f5f5;color:#333333;">🛡️</div>
                    <h3>Trust & Safety</h3>
                    <p>Multi-level ID verification, background checks, and community reviews ensure you always know who you're dealing with.</p>
                </div>
                <div class="value-card">
                    <div class="icon" style="background:#f5f5f5;color:#333333;">🤝</div>
                    <h3>Community First</h3>
                    <p>We're building more than a platform — we're building a global community of verified, respectful neighbors.</p>
                </div>
                <div class="value-card">
                    <div class="icon" style="background:#f0f0f0;color:#2563eb;">💎</div>
                    <h3>Transparency</h3>
                    <p>No hidden fees, no fake listings, no bait-and-switch. What you see is exactly what you get.</p>
                </div>
                <div class="value-card">
                    <div class="icon" style="background:#f5f5f5;color:#555555;">🚀</div>
                    <h3>Innovation</h3>
                    <p>We continuously improve our platform based on real user feedback. Your voice shapes our roadmap.</p>
                </div>
                <div class="value-card">
                    <div class="icon" style="background:#f5f5f5;color:#1a1a1a;">❤️</div>
                    <h3>Inclusivity</h3>
                    <p>Everyone is welcome on RoommateGroups. We have a zero-tolerance policy for discrimination of any kind.</p>
                </div>
                <div class="value-card">
                    <div class="icon" style="background:#f5f5f5;color:#333333;">🌍</div>
                    <h3>Global Reach</h3>
                    <p>From Austin to Amsterdam, we're expanding to help people find great homes in every corner of the world.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Team -->
    <section class="about-section">
        <div class="about-container">
            <div class="section-label">The People Behind It</div>
            <div class="section-title">Meet Our Team</div>
            <p class="section-sub">A passionate team of renters, builders, and dreamers committed to making housing better for everyone.</p>
            <div class="team-grid">
                ${[{name:"Alex Rivera",role:"CEO & Co-Founder",emoji:"👨‍💼",bg:"linear-gradient(135deg,#1a1a1a,#444444)"},{name:"Priya Sharma",role:"CTO & Co-Founder",emoji:"👩‍💻",bg:"linear-gradient(135deg,#1a1a1a,#444444)"},{name:"James Chen",role:"Head of Trust & Safety",emoji:"🛡️",bg:"linear-gradient(135deg,#1a1a1a,#444444)"},{name:"Sofia Martinez",role:"Head of Growth",emoji:"📈",bg:"linear-gradient(135deg,#1a1a1a,#444444)"},{name:"Marcus Williams",role:"Head of Design",emoji:"🎨",bg:"linear-gradient(135deg,#1a1a1a,#444444)"},{name:"Emma Johnson",role:"Head of Community",emoji:"🤝",bg:"linear-gradient(135deg,#1a1a1a,#444444)"}].map(t=>`
                    <div class="team-card">
                        <div class="team-card-avatar" style="background:${t.bg};">${t.emoji}</div>
                        <div class="team-card-body">
                            <h3>${t.name}</h3>
                            <p>${t.role}</p>
                        </div>
                    </div>
                `).join("")}
            </div>
        </div>
    </section>

    <!-- CTA -->
    <section style="background:#f2f2f2;padding:80px 0;text-align:center;color:#1a1a1a;border-top:1px solid #e2e8f0;">
        <div class="about-container">
            <h2 style="font-size:2rem;font-weight:800;margin-bottom:16px;">Ready to Find Your Perfect Match?</h2>
            <p style="color:#64748b;margin-bottom:32px;font-size:1.05rem;">Join over 1.5 million members who've already found their home through RoommateGroups.</p>
            <div style="display:flex;gap:16px;justify-content:center;flex-wrap:wrap;">
                <a href="/auth/register" style="background:#1a1a1a;color:white;padding:14px 32px;border-radius:10px;font-weight:700;text-decoration:none;font-size:1rem;">Get Started Free</a>
                <a href="/search/rooms" style="background:white;color:#1a1a1a;padding:14px 32px;border-radius:10px;font-weight:700;text-decoration:none;font-size:1rem;border:1px solid #e2e8f0;">Browse Listings</a>
            </div>
        </div>
    </section>

    ${ge()}
    `,ce()}const Na=[{category:"Getting Started",icon:"🚀",faqs:[{q:"Is RoommateGroups free to use?",a:"Our basic plan is completely free — you can browse listings, create a profile, and contact other members. Premium plans unlock advanced features like featured listings, unlimited messages, and priority search placement."},{q:"How do I create an account?",a:'Click "Get Started" or "Sign Up" on any page. You only need a valid email address. After registering, we recommend completing your profile and verifying your identity to build trust with other members.'},{q:"Can I list my room or entire apartment?",a:'Yes! You can list a private room in a shared home, an entire apartment, or a room in a coliving space. Use the "Post a Listing" button from your dashboard to get started.'},{q:"Is RoommateGroups available outside the US?",a:"Yes! We currently operate in 30+ cities including Paris, Berlin, Amsterdam, and many more. We're expanding internationally every quarter."}]},{category:"Safety & Trust",icon:"🛡️",faqs:[{q:"How does ID verification work?",a:"Our 4-level verification system starts with email, then phone, then Government ID (passport or driver's license matched with a live selfie), and finally Community Verification from peer reviews. Each level unlocks more benefits."},{q:"Are listings screened for scams?",a:"Yes. Our AI-powered scam detection flags suspicious listings before they go live. We also allow community members to report suspicious activity. All reported listings are reviewed within 24 hours."},{q:"What if someone contacts me inappropriately?",a:'Use the "Report" button on any message or profile. Our Trust & Safety team reviews all reports within 24 hours. Repeated violations result in permanent account suspension.'},{q:"Are my personal details shared publicly?",a:"No. Your exact address and phone number are never shared publicly. Only your display name, profile photo, and verification badges are visible to other members before you choose to connect."}]},{category:"Listings & Pricing",icon:"🏠",faqs:[{q:"How do I make my listing stand out?",a:"Upload high-quality photos, write a detailed description, set accurate amenities, complete your ID verification (it shows a badge on your listing), and consider upgrading to a Featured Listing for 3x more views."},{q:"Can I edit or deactivate my listing?",a:"Yes, you can edit, pause, or delete your listing anytime from your Dashboard → My Listings section."},{q:"What are featured listings?",a:"Featured listings appear at the top of search results for your city. They receive on average 3x more views and generate significantly more inquiries. Available on our Pro and Premium plans."},{q:"How does pricing work?",a:"Free accounts can post 1 listing at a time. Pro accounts ($9.99/mo) get 5 listings and featured placement. Premium accounts ($24.99/mo) get unlimited listings and all advanced features."}]},{category:"Payments & Billing",icon:"💳",faqs:[{q:"What payment methods are accepted?",a:"We accept all major credit and debit cards (Visa, Mastercard, Amex), PayPal, and Apple Pay. All payments are processed securely through Stripe."},{q:"Can I cancel my subscription anytime?",a:"Yes. You can cancel your subscription at any time from your Dashboard → Subscription page. You'll retain access to premium features until the end of your current billing period."},{q:"Do you offer refunds?",a:"We offer a 7-day money-back guarantee on all new subscriptions. If you're not satisfied within the first 7 days, contact us for a full refund."},{q:"Is my payment information secure?",a:"Absolutely. We never store your full card details. All payment data is handled by Stripe, which is PCI-DSS Level 1 certified — the highest level of payment security."}]}];function Ua(e){e.innerHTML=`
    <style>
        .faq-hero { background: #f2f2f2; color: #1a1a1a; border-bottom: 1px solid #e2e8f0; padding: 100px 24px 80px; text-align: center; }
        .faq-hero h1 { font-size: clamp(2rem, 5vw, 3rem); font-weight: 800; margin-bottom: 16px; }
        .faq-hero p { opacity: 0.8; max-width: 600px; margin: 0 auto 32px; font-size: 1.1rem; }
        .faq-search-wrap { max-width: 480px; margin: 0 auto; position: relative; }
        .faq-search { width: 100%; padding: 14px 20px 14px 48px; border-radius: 12px; border: none; font-size: 1rem; outline: none; }
        .faq-search-icon { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: #64748b; }
        .faq-container { max-width: 860px; margin: 0 auto; padding: 60px 24px; }
        .faq-category { margin-bottom: 48px; }
        .faq-cat-header { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
        .faq-cat-header span { font-size: 1.5rem; }
        .faq-cat-header h2 { font-size: 1.3rem; font-weight: 800; color: #1a1a1a; }
        .faq-item { border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 10px; overflow: hidden; transition: box-shadow 0.2s; }
        .faq-item:hover { box-shadow: 0 4px 12px rgba(99,102,241,0.08); }
        .faq-q { display: flex; justify-content: space-between; align-items: center; padding: 18px 20px; cursor: pointer; gap: 16px; font-weight: 600; color: #1e293b; user-select: none; }
        .faq-q .chevron { color: #64748b; transition: transform 0.3s; flex-shrink: 0; }
        .faq-item.open .faq-q .chevron { transform: rotate(180deg); }
        .faq-item.open .faq-q { color: #1a1a1a; }
        .faq-a { max-height: 0; overflow: hidden; transition: max-height 0.35s ease, padding 0.2s; background: #f8fafc; }
        .faq-item.open .faq-a { max-height: 200px; padding: 16px 20px; }
        .faq-a p { color: #475569; line-height: 1.8; font-size: 0.95rem; }
        .contact-cta { background: #f2f2f2; border: 1px solid #e2e8f0; border-radius: 20px; padding: 48px; text-align: center; color: #1a1a1a; margin-top: 48px; }
        .contact-cta h2 { font-size: 1.6rem; font-weight: 800; margin-bottom: 12px; }
        .contact-cta p { opacity: 0.85; margin-bottom: 24px; }
    </style>

    ${se()}

    <div class="faq-hero">
        <h1>Frequently Asked Questions</h1>
        <p>Can't find what you're looking for? Our support team is always ready to help.</p>
        <div class="faq-search-wrap">
            <i class="fas fa-search faq-search-icon"></i>
            <input type="text" class="faq-search" id="faq-search" placeholder="Search questions..." autocomplete="off">
        </div>
    </div>

    <div class="faq-container">
        ${Na.map((a,i)=>`
            <div class="faq-category" data-cat="${i}">
                <div class="faq-cat-header">
                    <span>${a.icon}</span>
                    <h2>${a.category}</h2>
                </div>
                ${a.faqs.map((s,o)=>`
                    <div class="faq-item" data-idx="${i}-${o}">
                        <div class="faq-q">
                            <span>${s.q}</span>
                            <i class="fas fa-chevron-down chevron"></i>
                        </div>
                        <div class="faq-a"><p>${s.a}</p></div>
                    </div>
                `).join("")}
            </div>
        `).join("")}

        <div class="contact-cta">
            <h2>Still have questions?</h2>
            <p>Our friendly support team is available 7 days a week, 9am–9pm ET.</p>
            <a href="/contact" style="background:#1a1a1a;color:white;padding:12px 28px;border-radius:10px;font-weight:700;text-decoration:none;font-size:0.95rem;">Contact Support</a>
        </div>
    </div>

    ${ge()}
    `,e.querySelectorAll(".faq-item").forEach(a=>{a.querySelector(".faq-q").addEventListener("click",()=>{a.classList.toggle("open")})});const t=e.querySelector("#faq-search");t&&t.addEventListener("input",()=>{const a=t.value.toLowerCase();e.querySelectorAll(".faq-item").forEach(i=>{const s=i.textContent.toLowerCase();i.style.display=s.includes(a)?"":"none"}),e.querySelectorAll(".faq-category").forEach(i=>{const s=[...i.querySelectorAll(".faq-item")].some(o=>o.style.display!=="none");i.style.display=s?"":"none"})}),ce()}const Ha=[{icon:"🔍",color:"#1a1a1a",bg:"#f5f5f5",title:"Verify Before You Trust",tips:["Always check for the blue verification badges on profiles — ID Verified users have passed a government ID check.","Search for the listing address on Google Maps to confirm it exists and matches the photos.","Ask for a video tour if you cannot visit in person — legitimate hosts are always happy to do this.","Cross-check the profile across social media to verify the person is who they claim to be."]},{icon:"💬",color:"#333333",bg:"#f5f5f5",title:"Communicate Safely",tips:["Keep all communications within the RoommateGroups platform until you've verified the person's identity.","Never share your home address, financial details, or government ID with someone you haven't met or verified.","Be wary of anyone who insists on moving off-platform to WhatsApp or email immediately.","Use our messaging system — it creates a paper trail in case anything goes wrong."]},{icon:"🏠",color:"#333333",bg:"#f5f5f5",title:"Visiting & Moving In",tips:["Always visit the property in person or via live video before paying any money.","Bring a friend or tell someone your plans before visiting a property for the first time.","Meet in a public place first before seeing the property — this is a great safety precaution.","Never hand over cash or deposit before signing a written rental agreement or lease."]},{icon:"💰",color:"#555555",bg:"#f5f5f5",title:"Protect Your Money",tips:["Never wire money, use gift cards, or send cryptocurrency as payment before signing a lease.","Use a credit card or payment service with buyer protection for any deposits.","A legitimate landlord will never ask for payment before a viewing or before signing a contract.","Government-subsidized or below-market listings that seem too good to be true usually are — trust your instincts."]},{icon:"🚨",color:"#1a1a1a",bg:"#f5f5f5",title:"Red Flags to Watch For",tips:["The landlord/host claims to be abroad and cannot meet you or show the property.","You're asked to pay a large deposit before signing any paperwork or seeing the place.","The photos look too professional — do a reverse image search to check if they're stolen.","Prices are dramatically below market rate for the area — scammers use low prices to generate interest."]},{icon:"📋",color:"#333333",bg:"#f5f5f5",title:"Document Everything",tips:["Always get a signed lease or roommate agreement before moving in.","Document the condition of the property with photos and video before moving your belongings in.","Keep records of all payments — ask for receipts and use traceable payment methods.","Know your local tenant rights — most cities have strong protections for renters."]}];function Oa(e){e.innerHTML=`
    <style>
        .safety-hero { background: #f2f2f2; color: #1a1a1a; border-bottom: 1px solid #e2e8f0; padding: 100px 24px 80px; text-align: center; }
        .safety-hero h1 { font-size: clamp(2rem, 5vw, 3rem); font-weight: 800; margin-bottom: 16px; }
        .safety-hero p { opacity: 0.85; max-width: 600px; margin: 0 auto; font-size: 1.1rem; }
        .safety-container { max-width: 1000px; margin: 0 auto; padding: 60px 24px; }
        .tips-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(460px, 1fr)); gap: 24px; }
        .tip-card { background: white; border-radius: 16px; padding: 28px; box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
        .tip-card-header { display: flex; align-items: center; gap: 14px; margin-bottom: 20px; }
        .tip-icon { width: 52px; height: 52px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.6rem; flex-shrink: 0; }
        .tip-card-header h3 { font-size: 1.1rem; font-weight: 800; }
        .tip-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; }
        .tip-list li { display: flex; gap: 10px; font-size: 0.92rem; color: #475569; line-height: 1.6; }
        .tip-list li::before { content: '✓'; font-weight: 800; flex-shrink: 0; margin-top: 1px; }
        .alert-box { background: linear-gradient(135deg, #1a1a1a, #333333); color: white; border-radius: 16px; padding: 32px; margin-bottom: 40px; }
        .alert-box h2 { font-size: 1.3rem; font-weight: 800; margin-bottom: 12px; display: flex; align-items: center; gap: 10px; }
        .alert-box p { opacity: 0.9; line-height: 1.7; }
        .report-cta { background: #f2f2f2; border: 1px solid #e2e8f0; border-radius: 16px; padding: 40px; text-align: center; color: #1a1a1a; margin-top: 40px; }
        @media (max-width: 768px) { .tips-grid { grid-template-columns: 1fr; } }
    </style>

    ${se()}

    <div class="safety-hero">
        <div style="display:inline-flex;background:rgba(255,255,255,0.15);border-radius:50%;width:72px;height:72px;align-items:center;justify-content:center;font-size:2rem;margin-bottom:20px;">🛡️</div>
        <h1>Safety Tips & Scam Prevention</h1>
        <p>Your safety is our top priority. Follow these guidelines to have a secure, worry-free experience on RoommateGroups.</p>
    </div>

    <div class="safety-container">
        <div class="alert-box">
            <h2>⚠️ Golden Rule</h2>
            <p><strong>Never pay any money before you have signed a lease and seen the property in person (or via live video).</strong> Any request for payment before a signed agreement is a major red flag. When in doubt, report the listing and contact our Safety Team.</p>
        </div>

        <div class="tips-grid">
            ${Ha.map(t=>`
                <div class="tip-card">
                    <div class="tip-card-header">
                        <div class="tip-icon" style="background:${t.bg};color:${t.color};">${t.icon}</div>
                        <h3 style="color:${t.color};">${t.title}</h3>
                    </div>
                    <ul class="tip-list">
                        ${t.tips.map(a=>`<li><span style="color:${t.color};">✓</span>${a}</li>`).join("")}
                    </ul>
                </div>
            `).join("")}
        </div>

        <div class="report-cta">
            <div style="font-size:2.5rem;margin-bottom:12px;">🚨</div>
            <h2 style="font-size:1.5rem;font-weight:800;margin-bottom:10px;">Report Suspicious Activity</h2>
            <p style="opacity:0.85;margin-bottom:24px;">See a suspicious listing or user? Report it immediately. Our Trust & Safety team reviews all reports within 24 hours.</p>
            <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
                <a href="/contact" style="background:#1a1a1a;color:white;padding:12px 28px;border-radius:10px;font-weight:700;text-decoration:none;">Report a Listing</a>
                <a href="/faq" style="background:white;color:#1a1a1a;padding:12px 28px;border-radius:10px;font-weight:700;text-decoration:none;border:1px solid #e2e8f0;">Read FAQ</a>
            </div>
        </div>
    </div>

    ${ge()}
    `,ce()}function Ga(e){e.innerHTML=`
    <style>
        .legal-hero { background: linear-gradient(135deg, #1a1a1a 0%, #0f172a 100%); color: white; padding: 80px 24px; text-align: center; }
        .legal-hero h1 { font-size: clamp(2rem, 4vw, 2.5rem); font-weight: 800; margin-bottom: 12px; }
        .legal-hero p { opacity: 0.8; font-size: 1.05rem; }
        .legal-container { max-width: 800px; margin: 0 auto; padding: 60px 24px; color: #1a1a1a; line-height: 1.8; }
        .legal-container h2 { font-size: 1.5rem; font-weight: 800; color: #0f172a; margin: 40px 0 16px; }
        .legal-container h3 { font-size: 1.2rem; font-weight: 700; color: #1e293b; margin: 24px 0 12px; }
        .legal-container p { margin-bottom: 16px; font-size: 0.95rem; }
        .legal-container ul { margin-bottom: 16px; padding-left: 24px; font-size: 0.95rem; }
        .legal-container li { margin-bottom: 8px; }
        .last-updated { font-size: 0.85rem; color: #64748b; margin-bottom: 32px; font-weight: 600; padding-bottom: 24px; border-bottom: 1px solid #e2e8f0; }
    </style>

    ${se()}

    <div class="legal-hero">
        <h1>Terms of Service</h1>
        <p>Please read these terms carefully before using RoommateGroups.</p>
    </div>

    <div class="legal-container">
        <div class="last-updated">Last Updated: October 15, 2023</div>

        <h2>1. Acceptance of Terms</h2>
        <p>By accessing or using the RoommateGroups platform (the "Service"), you agree to be bound by these Terms of Service. If you do not agree to all of the terms and conditions, you may not access the Service. The Service is offered subject to your acceptance without modification of all of the terms and conditions contained herein.</p>

        <h2>2. User Accounts</h2>
        <p>To access certain features of the Service, you must register for an account. You agree to:</p>
        <ul>
            <li>Provide accurate, current, and complete information during the registration process.</li>
            <li>Maintain and promptly update your account information.</li>
            <li>Maintain the security of your password and accept all risks of unauthorized access to your account.</li>
            <li>Immediately notify us of any unauthorized use of your account.</li>
        </ul>
        <p>You must be at least 18 years old to use the Service.</p>

        <h2>3. Acceptable Use and Community Standards</h2>
        <p>You agree not to use the Service in any way that is unlawful, harmful, or violates our community standards. Specifically, you agree not to:</p>
        <ul>
            <li>Post false, inaccurate, misleading, or deceptive listings.</li>
            <li>Post discriminatory content or preferences based on race, color, national origin, religion, sex, familial status, or disability.</li>
            <li>Harass, stalk, or abuse other users.</li>
            <li>Attempt to circumvent our messaging platform to avoid fees or verification.</li>
            <li>Scrape, crawl, or mass-download data from the Service without express written permission.</li>
        </ul>

        <h2>4. Listings and Transactions</h2>
        <p>RoommateGroups acts as a venue for users to connect. We are not a real estate broker, agent, or property manager. We do not own, manage, or control any of the properties listed on the Service.</p>
        <p><strong>We do not guarantee the accuracy, quality, safety, or legality of any listings.</strong> Any agreements entered into between users are solely between the users. RoommateGroups is not a party to any lease or rental agreement.</p>

        <h2>5. Premium Subscriptions</h2>
        <p>Some features of the Service are billed on a subscription basis ("Premium Services"). You will be billed in advance on a recurring, periodic basis. You may cancel your subscription at any time, but we do not provide refunds for partial billing periods unless explicitly stated otherwise.</p>

        <h2>6. Termination</h2>
        <p>We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms of Service. Upon termination, your right to use the Service will immediately cease.</p>

        <h2>7. Disclaimer of Warranties</h2>
        <p>The Service is provided "AS IS" and "AS AVAILABLE" without warranties of any kind, whether express or implied. RoommateGroups specifically disclaims any implied warranties of merchantability, fitness for a particular purpose, or non-infringement.</p>

        <h2>8. Contact Us</h2>
        <p>If you have any questions about these Terms, please contact us at <a href="mailto:legal@roommategroups.com" style="color:#1a1a1a;">legal@roommategroups.com</a> or via our <a href="/contact" style="color:#1a1a1a;">Contact Page</a>.</p>
    </div>

    ${ge()}
    `,ce()}function Wa(e){e.innerHTML=`
    <style>
        .legal-hero { background: linear-gradient(135deg, #1a1a1a 0%, #0f172a 100%); color: white; padding: 80px 24px; text-align: center; }
        .legal-hero h1 { font-size: clamp(2rem, 4vw, 2.5rem); font-weight: 800; margin-bottom: 12px; }
        .legal-hero p { opacity: 0.8; font-size: 1.05rem; }
        .legal-container { max-width: 800px; margin: 0 auto; padding: 60px 24px; color: #1a1a1a; line-height: 1.8; }
        .legal-container h2 { font-size: 1.5rem; font-weight: 800; color: #0f172a; margin: 40px 0 16px; }
        .legal-container h3 { font-size: 1.2rem; font-weight: 700; color: #1e293b; margin: 24px 0 12px; }
        .legal-container p { margin-bottom: 16px; font-size: 0.95rem; }
        .legal-container ul { margin-bottom: 16px; padding-left: 24px; font-size: 0.95rem; }
        .legal-container li { margin-bottom: 8px; }
        .last-updated { font-size: 0.85rem; color: #64748b; margin-bottom: 32px; font-weight: 600; padding-bottom: 24px; border-bottom: 1px solid #e2e8f0; }
        .highlight-box { background: #f8fafc; border-left: 4px solid #1a1a1a; padding: 20px; border-radius: 0 8px 8px 0; margin-bottom: 24px; font-size: 0.95rem; }
    </style>

    ${se()}

    <div class="legal-hero">
        <h1>Privacy Policy</h1>
        <p>How we collect, use, and protect your personal data.</p>
    </div>

    <div class="legal-container">
        <div class="last-updated">Last Updated: October 15, 2023</div>

        <div class="highlight-box">
            <strong>TL;DR:</strong> We only collect data needed to make the platform work and keep you safe. We never sell your personal data to third parties. Your exact address and phone number are hidden until you choose to share them.
        </div>

        <h2>1. Information We Collect</h2>
        <p>We collect information to provide better services to all our users. Information we collect includes:</p>
        <ul>
            <li><strong>Information you provide to us:</strong> Account details (name, email, password), profile information (bio, photos, preferences), and ID verification documents (which are handled securely by our verification partners and not stored permanently on our servers).</li>
            <li><strong>Information we get from your use of our services:</strong> Device information, log data, location information (at the city level), and usage statistics.</li>
            <li><strong>Communications:</strong> Messages sent through our platform to other users or to our support team.</li>
        </ul>

        <h2>2. How We Use Information</h2>
        <p>We use the information we collect to:</p>
        <ul>
            <li>Provide, maintain, and improve our Service.</li>
            <li>Verify your identity and prevent fraud, scams, and abuse.</li>
            <li>Connect you with potential roommates or housing matches based on your preferences.</li>
            <li>Process transactions and send related information, including confirmations and receipts.</li>
            <li>Send technical notices, updates, security alerts, and administrative messages.</li>
        </ul>

        <h2>3. How We Share Information</h2>
        <p>We do not share your personal information with companies, organizations, or individuals outside of RoommateGroups except in the following cases:</p>
        <ul>
            <li><strong>With your consent:</strong> When you choose to share your profile or listing with others.</li>
            <li><strong>For external processing:</strong> We provide personal information to trusted service providers (like Stripe for payments) to process it for us, based on our instructions and in compliance with our Privacy Policy.</li>
            <li><strong>For legal reasons:</strong> We will share personal information if we have a good-faith belief that access, use, preservation, or disclosure of the information is reasonably necessary to meet any applicable law, regulation, legal process, or enforceable governmental request.</li>
        </ul>

        <h2>4. Data Security</h2>
        <p>We work hard to protect RoommateGroups and our users from unauthorized access to or unauthorized alteration, disclosure, or destruction of information we hold. In particular:</p>
        <ul>
            <li>We encrypt many of our services using SSL.</li>
            <li>We review our information collection, storage, and processing practices to guard against unauthorized access to systems.</li>
            <li>We restrict access to personal information to RoommateGroups employees, contractors, and agents who need to know that information in order to process it for us.</li>
        </ul>

        <h2>5. Your Rights</h2>
        <p>Depending on your location (such as under GDPR or CCPA), you may have the right to access, correct, delete, or restrict the processing of your personal data. You can exercise many of these rights directly through your Account Settings. For further assistance, contact our privacy team.</p>

        <h2>6. Contact Us</h2>
        <p>If you have any questions about this Privacy Policy, please contact our Data Protection Officer at <a href="mailto:privacy@roommategroups.com" style="color:#1a1a1a;">privacy@roommategroups.com</a>.</p>
    </div>

    ${ge()}
    `,ce()}function Va(e){e.innerHTML=`
    <style>
        .contact-hero { background: #f2f2f2; color: #1a1a1a; border-bottom: 1px solid #e2e8f0; padding: 90px 24px 70px; text-align: center; }
        .contact-hero h1 { font-size: clamp(2rem, 5vw, 3rem); font-weight: 800; margin-bottom: 14px; }
        .contact-hero p { opacity: 0.85; font-size: 1.1rem; max-width: 560px; margin: 0 auto; }
        .contact-body { max-width: 1100px; margin: 0 auto; padding: 60px 24px; display: grid; grid-template-columns: 1fr 1.5fr; gap: 48px; align-items: start; }
        .contact-info h2 { font-size: 1.4rem; font-weight: 800; color: #1a1a1a; margin-bottom: 24px; }
        .contact-channel { display: flex; align-items: flex-start; gap: 16px; margin-bottom: 28px; }
        .contact-channel-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; flex-shrink: 0; }
        .contact-channel-text strong { display: block; font-weight: 700; color: #1e293b; margin-bottom: 2px; }
        .contact-channel-text span { font-size: 0.9rem; color: #64748b; }
        .contact-channel-text a { color: #333333; font-size: 0.9rem; }
        .contact-form-card { background: white; border-radius: 20px; padding: 36px; box-shadow: 0 8px 32px rgba(0,0,0,0.08); }
        .contact-form-card h2 { font-size: 1.3rem; font-weight: 800; color: #1e293b; margin-bottom: 24px; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .form-group { margin-bottom: 18px; }
        .form-group label { display: block; font-size: 0.85rem; font-weight: 600; color: #1a1a1a; margin-bottom: 6px; }
        .form-group input, .form-group select, .form-group textarea { width: 100%; padding: 11px 14px; border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 0.95rem; outline: none; transition: border-color 0.2s; font-family: inherit; box-sizing: border-box; }
        .form-group input:focus, .form-group select:focus, .form-group textarea:focus { border-color: #333333; box-shadow: 0 0 0 3px rgba(51,51,51,0.08); }
        .form-group input.field-error, .form-group select.field-error, .form-group textarea.field-error { border-color: #ef4444; }
        .field-error-msg { font-size: 0.78rem; color: #ef4444; margin-top: 4px; display: none; }
        .form-group textarea { resize: vertical; min-height: 120px; }
        .btn-contact { width: 100%; background: linear-gradient(135deg, #333333, #555555); color: white; border: none; padding: 14px; border-radius: 10px; font-size: 1rem; font-weight: 700; cursor: pointer; transition: opacity 0.2s; }
        .btn-contact:hover { opacity: 0.9; }
        .btn-contact:disabled { opacity: 0.7; cursor: not-allowed; }
        .success-msg { display: none; background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; padding: 18px 20px; border-radius: 10px; margin-top: 16px; font-weight: 600; text-align: center; }
        @media (max-width: 768px) {
            .contact-body { grid-template-columns: 1fr; }
            .form-row { grid-template-columns: 1fr; }
        }
    </style>

    ${se()}

    <div class="contact-hero">
        <div style="font-size:3rem;margin-bottom:16px;">💬</div>
        <h1>Get in Touch</h1>
        <p>Our support team is available 7 days a week to help with any questions or concerns you may have.</p>
    </div>

    <div class="contact-body">
        <div class="contact-info">
            <h2>How Can We Help?</h2>

            <div class="contact-channel">
                <div class="contact-channel-icon" style="background:#f5f5f5;color:#333333;">📧</div>
                <div class="contact-channel-text">
                    <strong>Email Support</strong>
                    <span>Typically responds within 2 hours</span>
                    <a href="mailto:support@roommategroups.com" style="display:block;margin-top:4px;">support@roommategroups.com</a>
                </div>
            </div>
            <div class="contact-channel">
                <div class="contact-channel-icon" style="background:#f0f0f0;color:#2563eb;">💬</div>
                <div class="contact-channel-text">
                    <strong>Live Chat</strong>
                    <span>Mon–Fri 9am–9pm ET · Sat–Sun 10am–6pm ET</span>
                    <a href="#" id="open-chat" style="display:block;margin-top:4px;">Start a chat</a>
                </div>
            </div>
            <div class="contact-channel">
                <div class="contact-channel-icon" style="background:#f5f5f5;color:#555555;">🛡️</div>
                <div class="contact-channel-text">
                    <strong>Trust & Safety</strong>
                    <span>Report scams, abuse, or urgent issues</span>
                    <a href="mailto:safety@roommategroups.com" style="display:block;margin-top:4px;">safety@roommategroups.com</a>
                </div>
            </div>
            <div class="contact-channel">
                <div class="contact-channel-icon" style="background:#f5f5f5;color:#333333;">🤝</div>
                <div class="contact-channel-text">
                    <strong>Partnerships & Press</strong>
                    <span>Business inquiries and media requests</span>
                    <a href="mailto:hello@roommategroups.com" style="display:block;margin-top:4px;">hello@roommategroups.com</a>
                </div>
            </div>

            <div style="background:#f8fafc;border-radius:12px;padding:20px;margin-top:8px;">
                <h3 style="font-size:0.95rem;font-weight:700;color:#1e293b;margin-bottom:12px;">
                    <i class="fas fa-clock" style="color:#333333;"></i> Support Hours
                </h3>
                <table style="font-size:0.85rem;color:#64748b;width:100%;border-collapse:collapse;">
                    <tr><td style="padding:4px 0;">Monday – Friday</td><td style="text-align:right;font-weight:600;color:#1e293b;">9:00 AM – 9:00 PM ET</td></tr>
                    <tr><td style="padding:4px 0;">Saturday – Sunday</td><td style="text-align:right;font-weight:600;color:#1e293b;">10:00 AM – 6:00 PM ET</td></tr>
                    <tr><td style="padding:4px 0;">Email response</td><td style="text-align:right;font-weight:600;color:#1e293b;">Within 2 hours</td></tr>
                </table>
            </div>
        </div>

        <div class="contact-form-card">
            <h2><i class="fas fa-paper-plane" style="color:#333333;margin-right:8px;"></i>Send a Message</h2>
            <div class="form-row">
                <div class="form-group">
                    <label>First Name *</label>
                    <input type="text" id="contact-fname" placeholder="Alex">
                    <div class="field-error-msg" id="err-fname">Please enter your first name.</div>
                </div>
                <div class="form-group">
                    <label>Last Name *</label>
                    <input type="text" id="contact-lname" placeholder="Rivera">
                    <div class="field-error-msg" id="err-lname">Please enter your last name.</div>
                </div>
            </div>
            <div class="form-group">
                <label>Email Address *</label>
                <input type="email" id="contact-email" placeholder="you@example.com">
                <div class="field-error-msg" id="err-email">Please enter a valid email address.</div>
            </div>
            <div class="form-group">
                <label>Topic *</label>
                <select id="contact-topic">
                    <option value="">Select a topic...</option>
                    <option value="account">Account & Login</option>
                    <option value="listing">Listing Help</option>
                    <option value="safety">Safety & Scam Report</option>
                    <option value="billing">Billing & Subscription</option>
                    <option value="verification">Verification Issues</option>
                    <option value="partnership">Partnership / Press</option>
                    <option value="other">Other</option>
                </select>
                <div class="field-error-msg" id="err-topic">Please select a topic.</div>
            </div>
            <div class="form-group">
                <label>Message *</label>
                <textarea id="contact-message" placeholder="Describe your issue or question in detail..."></textarea>
                <div class="field-error-msg" id="err-message">Please enter a message (at least 10 characters).</div>
            </div>
            <button class="btn-contact" id="btn-contact-submit">
                <i class="fas fa-paper-plane"></i> Send Message
            </button>
            <div class="success-msg" id="contact-success">
                <i class="fas fa-check-circle"></i> Message sent successfully! We'll get back to you within 2 hours.
            </div>
        </div>
    </div>

    ${ge()}
    `;const t={account:"Account & Login",listing:"Listing Help",safety:"Safety & Scam Report",billing:"Billing & Subscription",verification:"Verification Issues",partnership:"Partnership / Press",other:"Other"};function a(o,n,l){l?(o.classList.add("field-error"),n.style.display="block"):(o.classList.remove("field-error"),n.style.display="none")}function i(o){return/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(o)}const s=e.querySelector("#btn-contact-submit");s&&s.addEventListener("click",()=>{const o=e.querySelector("#contact-fname"),n=e.querySelector("#contact-lname"),l=e.querySelector("#contact-email"),d=e.querySelector("#contact-topic"),v=e.querySelector("#contact-message"),b=o.value.trim(),y=n.value.trim(),g=l.value.trim(),f=d.value,h=v.value.trim();let c=!0;a(o,e.querySelector("#err-fname"),!b),b||(c=!1),a(n,e.querySelector("#err-lname"),!y),y||(c=!1),a(l,e.querySelector("#err-email"),!i(g)),i(g)||(c=!1),a(d,e.querySelector("#err-topic"),!f),f||(c=!1),a(v,e.querySelector("#err-message"),h.length<10),h.length<10&&(c=!1),c&&(s.innerHTML='<i class="fas fa-spinner fa-spin"></i> Sending...',s.disabled=!0,u.user_queries.create({first_name:b,last_name:y,email:g,topic:f,topic_label:t[f]||f,message:h,status:"new",is_read:!1,reply:null,replied_at:null}),setTimeout(()=>{e.querySelector("#contact-success").style.display="block",s.innerHTML='<i class="fas fa-check"></i> Sent!',o.value="",n.value="",l.value="",d.value="",v.value=""},800))}),ce()}function Ae(e){return e?String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"):""}function Rt(e){return e?new Date(e).toLocaleDateString(void 0,{month:"short",day:"numeric",year:"numeric"}):"Flexible"}function Ya(e,t="success"){const a=document.getElementById("rg-toast");a&&a.remove();const i=document.createElement("div");i.id="rg-toast",i.className="rg-toast rg-toast-"+t,i.innerHTML='<i class="fa-solid '+(t==="error"?"fa-circle-exclamation":"fa-circle-check")+'"></i> '+e,document.body.appendChild(i),setTimeout(()=>i.classList.add("visible"),10),setTimeout(()=>{i.classList.remove("visible"),setTimeout(()=>i.remove(),300)},3500)}function Je(e,t){return e?typeof e=="string"?e:e[t]||e.medium||e.full||e.thumb||"":""}let Ke=null;function Ja(e,t){const a=t.id;console.log("[Listing] Rendering ID:",a);const i=u.listings.findById(a);if(!i){e.innerHTML=`
            ${se()}
            <div style="max-width:800px;margin:100px auto;text-align:center;padding:40px;">
                <div style="font-size:4rem;margin-bottom:20px;">🕵️</div>
                <h1 style="font-size:2rem;font-weight:800;color:#1e293b;margin-bottom:16px;">Listing Not Found</h1>
                <p style="color:#64748b;margin-bottom:32px;">The listing you're looking for may have been removed or rented.</p>
                <a href="/search/rooms" style="background:#1a1a1a;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;">Back to Search</a>
            </div>
            ${ge()}
        `;return}const s=ee();(!s||s.id!==i.user_id)&&u.listings.update(a,{views_count:(i.views_count||0)+1});const o=i.category==="roommate_wanted",n=i.photos&&i.photos.length>0?i.photos:["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&h=800&fit=crop"];let l=i.user_details;!l&&i.user_id&&(l=u.users.findById(i.user_id));const d=l?l.display_name:"Unknown User",v=l&&l.profile_photo?l.profile_photo:"https://ui-avatars.com/api/?name="+encodeURIComponent(d)+"&background=6366f1&color=fff",b=l?je(l):"",y={amen_wifi:{icon:"fa-wifi",label:"Fast WiFi"},amen_laundry:{icon:"fa-jug-detergent",label:"In-unit Laundry"},amen_gym:{icon:"fa-dumbbell",label:"Fitness Center"},amen_ac:{icon:"fa-snowflake",label:"Air Conditioning"},amen_parking:{icon:"fa-car",label:"Parking Available"},amen_pool:{icon:"fa-water-ladder",label:"Swimming Pool"},amen_pets:{icon:"fa-paw",label:"Pet Friendly"},amen_tv:{icon:"fa-tv",label:"Smart TV"},amen_balcony:{icon:"fa-umbrella-beach",label:"Balcony/Patio"},amen_kitchen:{icon:"fa-kitchen-set",label:"Full Kitchen"},amen_elevator:{icon:"fa-elevator",label:"Elevator"}},g=ee(),f=!!(g&&i.user_id&&g.id===i.user_id);let h=!1;if(g&&!f){const c=u.users.findById(g.id);c&&c.saved_listings&&c.saved_listings.includes(i.listing_id)&&(h=!0)}e.innerHTML=`
    <style>
        .ld-body { background: #f8fafc; min-height: 100vh; padding-bottom: 80px; }
        
        /* ── Gallery ── */
        .ld-gallery-wrap { max-width: 1200px; margin: 24px auto; padding: 0 24px; position: relative; }
        .ld-gallery-grid { display: grid; grid-template-columns: 3fr 2fr; height: 500px; gap: 6px; border-radius: 16px; overflow: hidden; }
        .ld-gallery-thumbs { display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 6px; }
        .ld-gallery-slot { position: relative; overflow: hidden; background: #e2e8f0; cursor: pointer; }
        .ld-thumb-empty { background: #f1f5f9; cursor: default; }
        .ld-img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.4s ease; }
        .ld-gallery-slot:not(.ld-thumb-empty):hover .ld-img { transform: scale(1.04); }
        .ld-img-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0); display: flex; align-items: center; justify-content: center; color: white; font-size: 1.8rem; opacity: 0; transition: all 0.28s; z-index: 2; pointer-events: none; }
        .ld-gallery-slot:not(.ld-thumb-empty):hover .ld-img-overlay { background: rgba(0,0,0,0.22); opacity: 1; }
        .ld-img-skeleton { position: absolute; inset: 0; background: linear-gradient(90deg,#e2e8f0 25%,#f1f5f9 50%,#e2e8f0 75%); background-size: 200% 100%; animation: ld-shimmer 1.6s ease-in-out infinite; z-index: 1; transition: opacity 0.35s; pointer-events: none; }
        @keyframes ld-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        .ld-gallery-more-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.52); display: flex; align-items: center; justify-content: center; color: white; font-size: 1.5rem; font-weight: 700; z-index: 3; }
        .ld-view-all-btn { position: absolute; bottom: 18px; right: 44px; background: white; color: #1a1a1a; border: 1.5px solid #e2e8f0; padding: 9px 16px; border-radius: 10px; font-size: 0.88rem; font-weight: 700; cursor: pointer; box-shadow: 0 2px 12px rgba(0,0,0,0.1); transition: background 0.2s; display: flex; align-items: center; gap: 7px; z-index: 10; }
        .ld-view-all-btn:hover { background: #f8fafc; }
        /* ── Lightbox ── */
        .ld-lightbox { position: fixed; inset: 0; background: rgba(0,0,0,0.94); z-index: 9999; display: flex; align-items: center; justify-content: center; opacity: 0; pointer-events: none; transition: opacity 0.25s; }
        .ld-lightbox.open { opacity: 1; pointer-events: all; }
        .ld-lb-img-wrap { max-width: 90vw; max-height: 88vh; display: flex; align-items: center; justify-content: center; }
        #ld-lb-img { max-width: 90vw; max-height: 88vh; object-fit: contain; border-radius: 6px; transition: opacity 0.18s; display: block; user-select: none; }
        .ld-lb-close { position: absolute; top: 20px; right: 22px; background: rgba(255,255,255,0.12); border: none; color: white; width: 46px; height: 46px; border-radius: 50%; cursor: pointer; font-size: 1.1rem; display: flex; align-items: center; justify-content: center; transition: background 0.2s; z-index: 1; }
        .ld-lb-close:hover,.ld-lb-prev:hover,.ld-lb-next:hover { background: rgba(255,255,255,0.22); }
        .ld-lb-prev,.ld-lb-next { position: absolute; top: 50%; transform: translateY(-50%); background: rgba(255,255,255,0.12); border: none; color: white; width: 54px; height: 54px; border-radius: 50%; cursor: pointer; font-size: 1.2rem; display: flex; align-items: center; justify-content: center; transition: background 0.2s; z-index: 1; }
        .ld-lb-prev { left: 22px; } .ld-lb-next { right: 22px; }
        .ld-lb-counter { position: absolute; bottom: 26px; left: 50%; transform: translateX(-50%); color: rgba(255,255,255,0.85); font-size: 0.9rem; font-weight: 600; background: rgba(0,0,0,0.38); padding: 6px 16px; border-radius: 20px; white-space: nowrap; }
        
        /* Main Layout */
        .ld-container { max-width: 1200px; margin: 40px auto; padding: 0 24px; display: grid; grid-template-columns: 2fr 1fr; gap: 64px; align-items: start; }
        
        /* Left Column - Details */
        .ld-header { margin-bottom: 32px; padding-bottom: 24px; border-bottom: 1px solid #e2e8f0; }
        .ld-title { font-size: clamp(1.8rem, 4vw, 2.4rem); font-weight: 800; color: #1e293b; margin-bottom: 12px; line-height: 1.2; }
        .ld-location { font-size: 1.1rem; color: #64748b; display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
        .ld-badges { display: flex; gap: 10px; flex-wrap: wrap; }
        .ld-badge { background: #f5f5f5; color: #1a1a1a; padding: 6px 14px; border-radius: 20px; font-size: 0.85rem; font-weight: 700; display: flex; align-items: center; gap: 6px; }
        
        .ld-section { margin-bottom: 40px; padding-bottom: 40px; border-bottom: 1px solid #e2e8f0; }
        .ld-section h2 { font-size: 1.4rem; font-weight: 800; color: #1e293b; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; }
        .ld-desc { color: #475569; font-size: 1.05rem; line-height: 1.8; white-space: pre-wrap; }
        
        .ld-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        .ld-fact { display: flex; align-items: center; gap: 16px; }
        .ld-fact-icon { width: 44px; height: 44px; background: #f1f5f9; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; color: #64748b; }
        .ld-fact-text strong { display: block; font-size: 0.9rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px; }
        .ld-fact-text span { font-size: 1.05rem; font-weight: 600; color: #1e293b; }
        
        .ld-amenities { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; }
        .ld-amenity { display: flex; align-items: center; gap: 12px; color: #475569; font-size: 1rem; }
        .ld-amenity i { font-size: 1.2rem; color: #64748b; width: 24px; text-align: center; }
        
        /* Right Column - Sticky Sidebar */
        .ld-sidebar { position: sticky; top: 100px; }
        .ld-price-card { background: white; border-radius: 24px; padding: 32px; box-shadow: 0 12px 40px rgba(0,0,0,0.08); border: 1px solid #f1f5f9; margin-bottom: 24px; }
        .ld-price { font-size: 2.5rem; font-weight: 800; color: #1e293b; margin-bottom: 4px; display: flex; align-items: baseline; gap: 8px; }
        .ld-price span { font-size: 1.1rem; color: #64748b; font-weight: 500; }
        .ld-deposit { font-size: 0.95rem; color: #64748b; margin-bottom: 24px; padding-bottom: 24px; border-bottom: 1px solid #e2e8f0; }
        
        .ld-btn-primary { width: 100%; background: linear-gradient(135deg, #1a1a1a, #333333); color: white; border: none; padding: 16px; border-radius: 12px; font-size: 1.1rem; font-weight: 700; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; margin-bottom: 12px; display: flex; align-items: center; justify-content: center; gap: 10px; }
        .ld-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(99,102,241,0.25); }
        .ld-btn-outline { width: 100%; background: white; color: #1e293b; border: 1.5px solid #e2e8f0; padding: 16px; border-radius: 12px; font-size: 1rem; font-weight: 700; cursor: pointer; transition: background 0.2s; display: flex; align-items: center; justify-content: center; gap: 10px; }
        .ld-btn-outline:hover { background: #f8fafc; }
        
        .ld-host-card { background: white; border-radius: 20px; padding: 24px; border: 1px solid #f1f5f9; display: flex; align-items: center; gap: 16px; cursor: pointer; transition: background 0.2s; }
        .ld-host-card:hover { background: #f8fafc; }
        .ld-host-avatar { width: 64px; height: 64px; border-radius: 50%; object-fit: cover; }
        .ld-host-info h4 { font-size: 1.1rem; font-weight: 700; color: #1e293b; margin-bottom: 4px; }
        .ld-host-info p { font-size: 0.9rem; color: #64748b; margin-bottom: 4px; }
        
        /* Mobile logic */
        @media (max-width: 992px) {
            .ld-container { grid-template-columns: 1fr; gap: 40px; }
            .ld-sidebar { position: static; }
        }
        @media (max-width: 768px) {
            .ld-gallery-grid { grid-template-columns: 1fr; height: 280px; border-radius: 0; }
            .ld-gallery-thumbs { display: none; }
            .ld-gallery-wrap { padding: 0; margin-top: 0; }
            .ld-view-all-btn { bottom: 12px; right: 12px; font-size: 0.8rem; padding: 7px 12px; }
            .ld-grid-2 { grid-template-columns: 1fr; }
        }
    </style>
    
    <div class="ld-body">
        ${se()}

        <!-- Photo Gallery — Airbnb-style: main image + 2×2 thumbnail grid -->
        <div class="ld-gallery-wrap">
            <div class="ld-gallery-grid">
                <div class="ld-gallery-slot ld-gallery-main" data-lb-idx="0">
                    <img src="${Je(n[0],"medium")}" class="ld-img" alt="${Ae(i.title)}" loading="eager" onload="var s=this.parentElement.querySelector('.ld-img-skeleton');if(s)s.style.opacity='0'">
                    <div class="ld-img-overlay"><i class="fa-solid fa-magnifying-glass-plus"></i></div>
                    <div class="ld-img-skeleton"></div>
                </div>
                ${n.length>1?`<div class="ld-gallery-thumbs">${[1,2,3,4].map(c=>{const m=n[c];if(!m)return'<div class="ld-gallery-slot ld-gallery-thumb ld-thumb-empty"></div>';const p=c===4&&n.length>5;return`<div class="ld-gallery-slot ld-gallery-thumb" data-lb-idx="${c}"><img src="${Je(m,"thumb")}" class="ld-img" alt="" loading="lazy" onload="var s=this.parentElement.querySelector('.ld-img-skeleton');if(s)s.style.opacity='0'"><div class="ld-img-overlay"><i class="fa-solid fa-magnifying-glass-plus"></i></div><div class="ld-img-skeleton"></div>${p?`<div class="ld-gallery-more-overlay">+${n.length-5} more</div>`:""}</div>`}).join("")}</div>`:""}
            </div>
            ${n.length>1?`<button class="ld-view-all-btn" id="ld-view-all-btn"><i class="fa-regular fa-images"></i> All ${n.length} photos</button>`:""}
        </div>

        <div class="ld-container">
            <!-- Left Column: Details -->
            <div class="ld-main">
                <div class="ld-header">
                    <h1 class="ld-title">${Ae(i.title)}</h1>
                    <div class="ld-location">
                        <i class="fa-solid fa-location-dot"></i>
                        ${Ae(i.neighborhood?i.neighborhood.replace("nh_","").replace(/_/g," ")+", ":"")}
                        ${Ae(u.cities.findById(i.city)?.name||(i.city?i.city.replace("city_","").replace(/_/g," "):"Unknown City"))}
                    </div>
                    <div class="ld-badges">
                        <div class="ld-badge"><i class="fa-solid fa-bed"></i> ${o?"Looking for Room":i.room_type||"Private Room"}</div>
                        ${i.furnished==="yes"?'<div class="ld-badge" style="background:#f5f5f5;color:#333333;"><i class="fa-solid fa-couch"></i> Furnished</div>':""}
                        ${i.private_bathroom?'<div class="ld-badge" style="background:#f5f5f5;color:#1a1a1a;"><i class="fa-solid fa-bath"></i> Private Bath</div>':""}
                    </div>
                </div>

                <div class="ld-section">
                    <h2><i class="fa-solid fa-circle-info text-primary"></i> Listing Overview</h2>
                    <div class="ld-grid-2">
                        <div class="ld-fact">
                            <div class="ld-fact-icon"><i class="fa-regular fa-calendar-check"></i></div>
                            <div class="ld-fact-text">
                                <strong>Date Available</strong>
                                <span>${Rt(i.available_date)}</span>
                            </div>
                        </div>
                        <div class="ld-fact">
                            <div class="ld-fact-icon"><i class="fa-solid fa-clock-rotate-left"></i></div>
                            <div class="ld-fact-text">
                                <strong>Min. Stay</strong>
                                <span>${i.min_stay_months?i.min_stay_months+" months":"Flexible"}</span>
                            </div>
                        </div>
                        <div class="ld-fact">
                            <div class="ld-fact-icon"><i class="fa-solid fa-users"></i></div>
                            <div class="ld-fact-text">
                                <strong>Current Cats/Dogs</strong>
                                <span>${i.pets_allowed==="yes"?"Allowed":"Not Allowed"}</span>
                            </div>
                        </div>
                        <div class="ld-fact">
                            <div class="ld-fact-icon"><i class="fa-solid fa-ruler-combined"></i></div>
                            <div class="ld-fact-text">
                                <strong>Property Type</strong>
                                <span>${i.property_type||"Apartment"}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="ld-section">
                    <h2><i class="fa-solid fa-align-left text-primary"></i> Description</h2>
                    <div class="ld-desc">${Ae(i.description||"No description provided.")}</div>
                </div>

                ${i.amenities&&i.amenities.length>0?`
                <div class="ld-section" style="border-bottom:none;">
                    <h2><i class="fa-solid fa-wand-magic-sparkles text-primary"></i> Amenities Included</h2>
                    <div class="ld-amenities">
                        ${i.amenities.map(c=>{const m=y[c]||{icon:"fa-circle-check",label:c.replace("amen_","")};return`<div class="ld-amenity"><i class="fa-solid ${m.icon}"></i> ${m.label}</div>`}).join("")}
                    </div>
                </div>
                `:""}
            </div>

            <!-- Right Column: Stick Sidebar -->
            <div class="ld-sidebar">
                <div class="ld-price-card">
                    <div class="ld-price">$${i.price} <span>/ month</span></div>
                    <div class="ld-deposit">Includes utilities: ${i.utilities_included?"Yes":"No"} • Deposit: $${i.deposit||0}</div>
                    
                    ${f?`
                    <a href="/dashboard/listings" class="ld-btn-primary" style="text-decoration:none;">
                        <i class="fa-solid fa-pen-to-square"></i> Edit Listing
                    </a>
                    <a href="/dashboard/listings" class="ld-btn-outline" style="text-decoration:none;color:#ef4444;border-color:#fecaca;">
                        <i class="fa-solid fa-eye"></i> Manage in Dashboard
                    </a>
                    `:`
                    <button class="ld-btn-primary" id="msg-host-btn">
                        <i class="fa-solid fa-paper-plane"></i> Message ${d.split(" ")[0]}
                    </button>
                    <button class="ld-btn-outline" id="active-save-btn" data-id="${i.listing_id}">
                        <i class="${h?"fa-solid":"fa-regular"} fa-heart" ${h?'style="color:#1a1a1a;"':""}></i>
                        <span class="save-text">${h?"Saved to Favorites":"Save to Favorites"}</span>
                    </button>
                    `}
                </div>

                <div class="ld-host-card" id="view-profile-card" data-uid="${l?l.user_id:""}">
                    <img src="${v}" class="ld-host-avatar" alt="${Ae(d)}">
                    <div class="ld-host-info">
                        <h4>${Ae(d)} ${b}</h4>
                        <p>Listed ${Rt(i.created_at)}</p>
                        <span style="font-size:0.85rem;color:#1a1a1a;font-weight:600;">${f?"Your Listing":"View Profile"} <i class="fa-solid fa-chevron-right" style="font-size:0.75rem;"></i></span>
                    </div>
                </div>

                ${f?"":`
                <div style="text-align:center;margin-top:20px;">
                    <button id="report-listing-btn" style="background:none;border:none;color:#94a3b8;font-size:0.9rem;text-decoration:underline;cursor:pointer;"><i class="fa-solid fa-flag"></i> Report this listing</button>
                </div>
                `}
            </div>
        </div>
        
        ${ge()}
    </div>
    <!-- Lightbox modal -->
    <div class="ld-lightbox" id="ld-lightbox">
        <button class="ld-lb-close" id="ld-lb-close"><i class="fa-solid fa-xmark"></i></button>
        <button class="ld-lb-prev" id="ld-lb-prev"><i class="fa-solid fa-chevron-left"></i></button>
        <div class="ld-lb-img-wrap"><img id="ld-lb-img" src="" alt="Full size photo"></div>
        <button class="ld-lb-next" id="ld-lb-next"><i class="fa-solid fa-chevron-right"></i></button>
        <div class="ld-lb-counter" id="ld-lb-counter">1 / ${n.length}</div>
    </div>
    `,setTimeout(()=>{const c=e.querySelector("#msg-host-btn");c&&c.addEventListener("click",()=>{const R=ee();if(!R){X("/auth/login");return}if(!l)return;let F=u.threads.findOne(H=>H.listing_id===i.listing_id&&H.participants.includes(R.id)&&H.participants.includes(l.user_id));F?u.threads.update(F.thread_id,{last_message_at:new Date().toISOString()}):(F=u.threads.create({listing_id:i.listing_id,participants:[R.id,l.user_id],last_message_at:new Date().toISOString(),last_message_preview:"Interested in this listing.",["unread_count_"+l.user_id]:1,["unread_count_"+R.id]:0,is_archived:!1,blocked_by:null}),u.messages.create({thread_id:F.thread_id,sender_id:R.id,content:"Hi! I am interested in your listing: "+i.title,is_read:!1,created_at:new Date().toISOString()})),X("/dashboard/messages?threadId="+F.thread_id)});const m=e.querySelector("#view-profile-card");m&&m.addEventListener("click",()=>{const R=m.dataset.uid;R&&X("/profile/"+R)});const p=e.querySelector("#report-listing-btn");p&&p.addEventListener("click",()=>{const R=prompt("Why are you reporting this listing?");R&&(u.reports.create({type:"listing",target_id:i.listing_id,target_name:i.title,reporter_id:ee()?.id||"anonymous",reason:R,status:"pending",priority:"medium"}),Ya("Report submitted. Thank you."))});const r=e.querySelector("#active-save-btn");r&&r.addEventListener("click",R=>{R.preventDefault();const F=r.dataset.id,H=ee();if(!H){X("/auth/login");return}const x=u.users.findById(H.id);if(!x)return;x.saved_listings||(x.saved_listings=[]);const O=x.saved_listings.indexOf(F);O>-1?(x.saved_listings.splice(O,1),r.querySelector("i").className="fa-regular fa-heart",r.querySelector("i").style.color="",r.querySelector(".save-text").textContent="Save to Favorites"):(x.saved_listings.push(F),r.querySelector("i").className="fa-solid fa-heart",r.querySelector("i").style.color="#1a1a1a",r.querySelector(".save-text").textContent="Saved to Favorites"),u.users.update(H.id,{saved_listings:x.saved_listings})});const w=e.querySelector("#ld-lightbox"),S=e.querySelector("#ld-lb-img"),A=e.querySelector("#ld-lb-counter");let _=0;function $(R){_=Math.max(0,Math.min(R,n.length-1)),S.style.opacity="0",S.src=Je(n[_],"full"),S.onload=()=>{S.style.opacity="1"},S.complete&&S.naturalWidth&&(S.style.opacity="1"),A.textContent=`${_+1} / ${n.length}`;const F=n.length>1;e.querySelector("#ld-lb-prev").style.display=F?"":"none",e.querySelector("#ld-lb-next").style.display=F?"":"none",w.classList.add("open"),document.body.style.overflow="hidden"}function E(){w.classList.remove("open"),document.body.style.overflow=""}function T(R){_=(_+R+n.length)%n.length,S.style.opacity="0",setTimeout(()=>{S.src=Je(n[_],"full"),S.onload=()=>{S.style.opacity="1"},S.complete&&S.naturalWidth&&(S.style.opacity="1"),A.textContent=`${_+1} / ${n.length}`},160)}e.querySelectorAll("[data-lb-idx]").forEach(R=>{R.addEventListener("click",()=>$(parseInt(R.dataset.lbIdx)))}),e.querySelector("#ld-lb-close").addEventListener("click",E),e.querySelector("#ld-lb-prev").addEventListener("click",()=>T(-1)),e.querySelector("#ld-lb-next").addEventListener("click",()=>T(1)),w.addEventListener("click",R=>{R.target===w&&E()});const j=e.querySelector("#ld-view-all-btn");j&&j.addEventListener("click",()=>$(0)),Ke&&(Ke(),Ke=null);function M(R){w.classList.contains("open")&&(R.key==="ArrowLeft"&&T(-1),R.key==="ArrowRight"&&T(1),R.key==="Escape"&&E())}document.addEventListener("keydown",M),Ke=()=>document.removeEventListener("keydown",M),ce()},0)}function Ka(e,t){const a=t.id,i=u.users.findById(a);if(!i){e.innerHTML=`
            ${se()}
            <div style="max-width:800px;margin:100px auto;text-align:center;padding:40px;">
                <div style="font-size:4rem;margin-bottom:20px;">👤</div>
                <h1 style="font-size:2rem;font-weight:800;color:#1e293b;margin-bottom:16px;">Profile Not Found</h1>
                <p style="color:#64748b;margin-bottom:32px;">The user you are looking for does not exist or has a private profile.</p>
                <a href="/" style="background:#1a1a1a;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;">Back to Home</a>
            </div>
        `;return}const s=i.profile_photo||"https://ui-avatars.com/api/?name="+encodeURIComponent(i.display_name)+"&background=6366f1&color=fff&size=200",o=je(i),n=ee(),l=u.listings.find(d=>d.user_id===i.user_id&&d.status==="active");e.innerHTML=`
    <style>
        .prof-container { max-width: 1000px; margin: 40px auto; padding: 0 24px; display: grid; grid-template-columns: 300px 1fr; gap: 40px; }
        .prof-sidebar { position: sticky; top: 100px; }
        .prof-card { background: white; border-radius: 24px; padding: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); border: 1px solid #f1f5f9; text-align: center; }
        .prof-avatar { width: 160px; height: 160px; border-radius: 50%; object-fit: cover; margin-bottom: 24px; border: 4px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .prof-name { font-size: 1.5rem; font-weight: 800; color: #1e293b; margin-bottom: 8px; }
        .prof-location { color: #64748b; font-size: 0.95rem; margin-bottom: 24px; display: flex; align-items: center; justify-content: center; gap: 6px; }
        
        .prof-badges { display: flex; flex-direction: column; gap: 12px; margin-top: 24px; text-align: left; }
        .prof-badge-item { display: flex; align-items: center; gap: 12px; font-size: 0.9rem; color: #475569; padding: 12px; background: #f8fafc; border-radius: 12px; }
        .prof-badge-item i { width: 20px; text-align: center; color: #1a1a1a; }

        .prof-main { }
        .prof-section { background: white; border-radius: 24px; padding: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); border: 1px solid #f1f5f9; margin-bottom: 32px; }
        .prof-section h2 { font-size: 1.3rem; font-weight: 800; color: #1e293b; margin-bottom: 20px; }
        .prof-bio { color: #475569; font-size: 1.05rem; line-height: 1.7; white-space: pre-wrap; }
        
        .prof-tags { display: flex; flex-wrap: wrap; gap: 10px; }
        .prof-tag { background: #f1f5f9; color: #475569; padding: 6px 14px; border-radius: 20px; font-size: 0.85rem; font-weight: 600; }

        .prof-listings-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px; }
        .prof-listing-card { background: white; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; transition: transform 0.2s; text-decoration: none; color: inherit; }
        .prof-listing-card:hover { transform: translateY(-4px); box-shadow: 0 12px 24px rgba(0,0,0,0.05); }
        .plc-img { width: 100%; height: 160px; object-fit: cover; }
        .plc-body { padding: 16px; }
        .plc-price { font-size: 1.1rem; font-weight: 800; color: #1a1a1a; margin-bottom: 4px; }
        .plc-title { font-size: 1rem; font-weight: 700; color: #1e293b; margin-bottom: 8px; }

        @media (max-width: 768px) {
            .prof-container { grid-template-columns: 1fr; }
            .prof-sidebar { position: static; }
        }
    </style>

    <div style="background:#f8fafc; min-height:100vh;">
        ${se()}

        <div class="prof-container">
            <div class="prof-sidebar">
                <div class="prof-card">
                    <img src="${s}" class="prof-avatar" alt="${i.display_name}">
                    <h1 class="prof-name">${i.display_name} ${o}</h1>
                    <div class="prof-location"><i class="fa-solid fa-location-dot"></i> ${i.city?i.city.replace("city_","").replace("_"," "):"Global Citizen"}</div>
                    
                    ${n&&n.id!==i.user_id?`
                        <button class="btn btn-primary" style="width:100%;" id="prof-msg-btn">
                            <i class="fa-solid fa-envelope"></i> Message
                        </button>
                    `:""}

                    <div class="prof-badges">
                         <div class="prof-badge-item"><i class="fa-solid fa-check-circle"></i> Identity Verified</div>
                         <div class="prof-badge-item"><i class="fa-solid fa-clock"></i> Joined ${new Date(i.created_at).toLocaleDateString(void 0,{month:"long",year:"numeric"})}</div>
                    </div>
                </div>
            </div>

            <div class="prof-main">
                <div class="prof-section">
                    <h2>About ${i.display_name.split(" ")[0]}</h2>
                    <div class="prof-bio">${i.bio||"No bio provided."}</div>
                </div>

                ${i.lifestyle_tags&&i.lifestyle_tags.length>0?`
                <div class="prof-section">
                    <h2>Lifestyle</h2>
                    <div class="prof-tags">
                        ${i.lifestyle_tags.map(d=>`<span class="prof-tag">${d.replace("tag_","")}</span>`).join("")}
                    </div>
                </div>
                `:""}

                <div class="prof-section">
                    <h2>Active Listings</h2>
                    ${l.length>0?`
                        <div class="prof-listings-grid">
                            ${l.map(d=>`
                                <a href="/listing/${d.listing_id}" class="prof-listing-card">
                                    <img src="${d.photos[0]||"https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600"}" class="plc-img">
                                    <div class="plc-body">
                                        <div class="plc-price">$${d.price}/mo</div>
                                        <div class="plc-title">${d.title}</div>
                                    </div>
                                </a>
                            `).join("")}
                        </div>
                    `:'<p style="color:#64748b;">No active listings at the moment.</p>'}
                </div>
            </div>
        </div>
    </div>
    `,setTimeout(()=>{const d=e.querySelector("#prof-msg-btn");d&&d.addEventListener("click",()=>{if(!n){X("/auth/login");return}const v=l.length>0?l[0].listing_id:null;let b=u.threads.findOne(y=>y.participants.includes(n.id)&&y.participants.includes(i.user_id)&&(v?y.listing_id===v:!0));b?u.threads.update(b.thread_id,{last_message_at:new Date().toISOString()}):(b=u.threads.create({listing_id:v,participants:[n.id,i.user_id],last_message_at:new Date().toISOString(),last_message_preview:"Started a conversation.",["unread_count_"+i.user_id]:1,["unread_count_"+n.id]:0,is_archived:!1,blocked_by:null}),u.messages.create({thread_id:b.thread_id,sender_id:n.id,content:"Hi! I saw your profile and wanted to connect.",is_read:!1,created_at:new Date().toISOString()})),X("/dashboard/messages?threadId="+b.thread_id)}),ce()},0)}function Qt(e){return e>=1e6?(e/1e6).toFixed(1)+"M":e>=1e3?(e/1e3).toFixed(1)+"K":String(e)}function Pt(e){const t="https://images.unsplash.com/photo-1449844908441-8829872d2607?w=600&h=400&fit=crop";return`
        <div class="fb-city-card animate-on-scroll visible">
            <div class="fb-city-image-wrap">
                <img
                    src="${e.city_image||t}"
                    alt="${e.city_name}"
                    loading="lazy"
                    class="city-image"
                    onerror="this.onerror=null;this.src='${t}';"
                >
                <div class="city-card-overlay">
                    <div class="city-card-name">${e.city_name}</div>
                </div>
            </div>
            <div class="fb-city-card-body">
                <div class="fb-group-name">
                    <i class="fab fa-facebook" style="color:#1877f2;margin-right:6px;"></i>
                    ${e.fb_group_name}
                </div>
                <div class="fb-member-count">
                    <i class="fas fa-users" style="color:var(--primary);margin-right:5px;"></i>
                    <strong>${Qt(e.total_members)}</strong> members
                </div>
                <a
                    href="${e.fb_group_link}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="btn btn-primary fb-join-btn"
                >
                    <i class="fab fa-facebook"></i>
                    Join Group
                </a>
            </div>
        </div>
    `}function zt(e,t,a,i){let s=t;return a&&(s=s.filter(n=>n.country_id===a)),i&&(s=s.filter(n=>n.fb_city_id===i)),s.length===0?`
            <div class="fb-empty-state">
                <div class="fb-empty-icon"><i class="fab fa-facebook"></i></div>
                <h3>No groups found</h3>
                <p>Try selecting a different country or city.</p>
                <button class="btn btn-outline" id="btn-clear-filters">Clear Filters</button>
            </div>
        `:i?`<div class="fb-single-result">${Pt(s[0])}</div>`:(a?e.filter(n=>n.fb_country_id===a):e).map(n=>{const l=s.filter(d=>d.country_id===n.fb_country_id);return l.length===0?"":`
            <div class="fb-country-section">
                <h2 class="fb-country-heading">
                    <i class="fas fa-globe" style="color:var(--primary);margin-right:10px;"></i>
                    ${n.country_name}
                    <span class="fb-country-count">${l.length} ${l.length===1?"group":"groups"}</span>
                </h2>
                <div class="cities-grid">
                    ${l.map(Pt).join("")}
                </div>
            </div>
        `}).join("")}function Qa(e){const t=u.fb_countries.findAll(),a=u.fb_cities.findAll(),i=a.length,s=a.reduce((f,h)=>f+(h.total_members||0),0);e.innerHTML=`
        ${se()}

        <!-- ── HERO ── -->
        <section class="fbg-hero">
            <div class="fbg-hero-bg"></div>
            <div class="container fbg-hero-content">
                <div class="fbg-hero-badge">
                    <i class="fab fa-facebook"></i>
                    Facebook Community Groups
                </div>
                <h1 class="fbg-hero-title">Find Your City's<br>Facebook Roommate Group</h1>
                <p class="fbg-hero-sub">
                    Join thousands of locals finding roommates &amp; rooms through our curated
                    Facebook groups — organized by country and city.
                </p>
                <div class="fbg-hero-stats">
                    <div class="fbg-stat"><strong>${i}</strong><span>Groups</span></div>
                    <div class="fbg-stat-divider"></div>
                    <div class="fbg-stat"><strong>${Qt(s)}</strong><span>Total Members</span></div>
                    <div class="fbg-stat-divider"></div>
                    <div class="fbg-stat"><strong>${t.length}</strong><span>Countries</span></div>
                </div>
            </div>
        </section>

        <!-- ── FILTER BAR ── -->
        <div class="fbg-filter-wrap">
            <div class="container">
                <div class="fbg-filter-bar">
                    <div class="fbg-filter-label">
                        <i class="fa-solid fa-filter"></i>
                        Filter Groups
                    </div>
                    <div class="fbg-filter-fields">
                        <div class="fbg-filter-field">
                            <label for="fbg-country-select">
                                <i class="fa-solid fa-globe"></i> Country
                            </label>
                            <select id="fbg-country-select" class="fbg-select">
                                <option value="">All Countries</option>
                                ${t.map(f=>`
                                    <option value="${f.fb_country_id}">${f.country_name}</option>
                                `).join("")}
                            </select>
                        </div>
                        <div class="fbg-filter-arrow">
                            <i class="fa-solid fa-chevron-right"></i>
                        </div>
                        <div class="fbg-filter-field">
                            <label for="fbg-city-select">
                                <i class="fa-solid fa-city"></i> City
                            </label>
                            <select id="fbg-city-select" class="fbg-select" disabled>
                                <option value="">Select a country first</option>
                            </select>
                        </div>
                        <button class="fbg-clear-btn" id="fbg-clear-btn" title="Clear filters">
                            <i class="fa-solid fa-xmark"></i> Clear
                        </button>
                    </div>
                    <div class="fbg-results-count" id="fbg-results-count">
                        Showing <strong>${i}</strong> groups
                    </div>
                </div>
            </div>
        </div>

        <!-- ── RESULTS ── -->
        <section class="section" id="fb-groups">
            <div class="container">
                <div id="fbg-results">
                    ${zt(t,a,"","")}
                </div>
            </div>
        </section>

        ${ge()}
    `,ce();const o=e.querySelector("#fbg-country-select"),n=e.querySelector("#fbg-city-select"),l=e.querySelector("#fbg-clear-btn"),d=e.querySelector("#fbg-results"),v=e.querySelector("#fbg-results-count");function b(f){if(!f){n.innerHTML='<option value="">Select a country first</option>',n.disabled=!0;return}const h=a.filter(c=>c.country_id===f);n.innerHTML=`
            <option value="">All cities in country</option>
            ${h.map(c=>`<option value="${c.fb_city_id}">${c.city_name}</option>`).join("")}
        `,n.disabled=!1}function y(){const f=o.value,h=n.value;d.innerHTML=zt(t,a,f,h);let c=a;f&&(c=c.filter(p=>p.country_id===f)),h&&(c=c.filter(p=>p.fb_city_id===h)),v.innerHTML=`Showing <strong>${c.length}</strong> group${c.length!==1?"s":""}`;const m=d.querySelector("#btn-clear-filters");m&&m.addEventListener("click",g)}function g(){o.value="",n.innerHTML='<option value="">Select a country first</option>',n.disabled=!0,y()}o.addEventListener("change",()=>{b(o.value),n.value="",y()}),n.addEventListener("change",y),l.addEventListener("click",g)}V("/",yi);V("/auth/register",xi);V("/auth/login",Ei);V("/auth/forgot-password",Ii);V("/profile-setup",Bi,[ye()]);V("/dashboard",_e,[ye()]);V("/dashboard/listings",_e,[ye()]);V("/dashboard/messages",_e,[ye()]);V("/dashboard/saved",_e,[ye()]);V("/dashboard/searches",_e,[ye()]);V("/dashboard/verification",_e,[ye()]);V("/dashboard/subscription",_e,[ye()]);V("/dashboard/settings",_e,[ye()]);V("/dashboard/notifications",_e,[ye()]);V("/post-listing",aa,[ye()]);V("/cities/:slug",Yt);V("/cities/:country/:slug",Yt);V("/search/rooms",Ca);V("/blog",Ma);V("/blog/:slug",Ra);V("/about",Fa);V("/faq",Ua);V("/safety",Oa);V("/terms",Ga);V("/privacy",Wa);V("/contact",Va);V("/listing/:id",Ja);V("/profile/:id",Ka);V("/fb-groups",Qa);V("/admin-login",qa);V("/admin",he,[be()]);V("/admin/listings",he,[be()]);V("/admin/users",he,[be()]);V("/admin/verifications",he,[be()]);V("/admin/reports",he,[be()]);V("/admin/analytics",he,[be()]);V("/admin/cities",he,[be()]);V("/admin/content",he,[be()]);V("/admin/settings",he,[be()]);V("/admin/fb-groups",he,[be()]);V("/admin/queries",he,[be()]);const Za=document.querySelector("#app");ci();li(Za);
