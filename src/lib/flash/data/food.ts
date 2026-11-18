/**
 * Demo restaurant and menu fixtures.
 *
 * Invented kitchens, invented menus, invented ratings and prices — nothing is
 * on sale. The photography is real (see docs/assets-provenance.md) and the alt
 * text describes what is actually in the frame.
 */

import type {
  Cuisine,
  MenuItemSize,
  MenuItemTopping,
  Restaurant,
} from "@/lib/flash/types";

/** A menu line before the portions, the extras and the tagline are attached. */
type MenuItemSeed = Omit<
  Restaurant["menu"][number],
  "sizes" | "toppings" | "tagline"
>;

/** A kitchen before its menu is filled in. */
type RestaurantSeed = Omit<Restaurant, "menu"> & { menu: MenuItemSeed[] };

/**
 * The portions a dish comes in.
 *
 * Every kitchen works the same way: the price on the menu is the regular
 * portion, and the larger one costs proportionally more.
 */
export function sizesFor(price: number): MenuItemSize[] {
  return [
    { id: "regular", name: "Regular", price },
    { id: "large", name: "Large", price: Math.round(price * 1.3) },
  ];
}

/**
 * The extras a kitchen of this cuisine offers.
 *
 * Exported so a dish posted through the console gets the same extras as the
 * ones that came with the menu.
 */
export function toppingsFor(cuisine: Cuisine): MenuItemTopping[] {
  return TOPPINGS_BY_CUISINE[cuisine] ?? [];
}

/**
 * What can be added to a dish, by the kitchen's own cooking.
 *
 * The extras are part of the cuisine, not a generic list: a bowl of jollof
 * takes shito and a fried egg, a pizza takes sausage and mushrooms.
 */
const TOPPINGS_BY_CUISINE: Record<Cuisine, MenuItemTopping[]> = {
  Ghanaian: [
    { id: "shito", name: "Extra shito", price: 2 },
    { id: "egg", name: "Fried egg", price: 5 },
    { id: "chicken", name: "Extra chicken", price: 8 },
    { id: "avocado", name: "Avocado", price: 6 },
  ],
  "Street Food": [
    { id: "shito", name: "Extra shito", price: 2 },
    { id: "egg", name: "Fried egg", price: 5 },
    { id: "cheese", name: "Extra cheese", price: 4 },
    { id: "suya", name: "Extra suya", price: 10 },
  ],
  Grill: [
    { id: "shito", name: "Extra shito", price: 2 },
    { id: "prawns", name: "Grilled prawns", price: 12 },
    { id: "avocado", name: "Avocado", price: 6 },
    { id: "banku", name: "Extra banku", price: 4 },
  ],
  Seafood: [
    { id: "prawns", name: "Extra prawns", price: 12 },
    { id: "lemon", name: "Lemon butter", price: 2 },
    { id: "avocado", name: "Avocado", price: 6 },
    { id: "chips", name: "Extra chips", price: 5 },
  ],
  Continental: [
    { id: "sauce", name: "Extra sauce", price: 3 },
    { id: "avocado", name: "Avocado", price: 6 },
    { id: "cheese", name: "Extra cheese", price: 5 },
    { id: "egg", name: "Fried egg", price: 5 },
  ],
  Pizza: [
    { id: "sausage", name: "Sausage", price: 7 },
    { id: "mushrooms", name: "Mushrooms", price: 5 },
    { id: "cheese", name: "Extra cheese", price: 6 },
    { id: "tomato", name: "Tomato", price: 3 },
  ],
  Burgers: [
    { id: "cheese", name: "Extra cheese", price: 5 },
    { id: "bacon", name: "Bacon", price: 8 },
    { id: "egg", name: "Fried egg", price: 5 },
    { id: "patty", name: "Extra patty", price: 12 },
  ],
  Breakfast: [
    { id: "egg", name: "Fried egg", price: 5 },
    { id: "avocado", name: "Avocado", price: 6 },
    { id: "bacon", name: "Extra bacon", price: 8 },
    { id: "toast", name: "Extra toast", price: 3 },
  ],
};

const seeds: RestaurantSeed[] = [
  {
    id: "rst-auntie-muni",
    slug: "auntie-munis-kitchen",
    name: "Auntie Muni's Kitchen",
    tagline: "Ghanaian home cooking, packed to travel",
    cuisine: "Ghanaian",
    neighbourhood: "Osu",
    rating: 4.8,
    ratingCount: 1240,
    deliveryFee: 15,
    etaMinutes: 30,
    distanceKm: 0.9,
    badge: "Trending",
    discount: { label: "10% off", percent: 10 },
    ownerId: "usr-saviour-mwini",
    businessId: "biz-auntie-muni",
    image: {
      src: "/assets/images/dish-fried-rice.jpg",
      alt: "Fried rice with chicken, sweetcorn and spring onion on a square plate",
    },
    menu: [
      {
        id: "mi-muni-jollof",
        name: "Party jollof & grilled chicken",
        description: "Smoky jollof rice, half chicken, coleslaw and ripe plantain",
        price: 45,
        image: {
          src: "/assets/images/dish-fried-rice.jpg",
          alt: "Fried rice with chicken, sweetcorn and spring onion on a square plate",
        },
        popular: true,
        vegetarian: false,
      },
      {
        id: "mi-muni-waakye",
        name: "Waakye with shito & egg",
        description: "Rice and beans with wele, shito, boiled egg and spaghetti",
        price: 30,
        image: {
          src: "/assets/images/dish-brunch-spread.jpg",
          alt: "A table spread of brunch plates, avocado toast and fresh juice",
        },
        popular: false,
        vegetarian: false,
      },
      {
        id: "mi-muni-banku",
        name: "Banku & grilled tilapia",
        description: "Fermented banku, whole tilapia, pepper sauce and onion",
        price: 55,
        image: {
          src: "/assets/images/dish-prawn-stew.jpg",
          alt: "Prawns in a brown stew served with white rice and coriander",
        },
        popular: false,
        vegetarian: false,
      },
      {
        id: "mi-muni-sobolo",
        name: "Hibiscus sobolo",
        description: "Chilled hibiscus, ginger and pineapple",
        price: 12,
        image: {
          src: "/assets/images/dish-brunch-spread.jpg",
          alt: "A table spread of brunch plates, avocado toast and fresh juice",
        },
        popular: false,
        vegetarian: true,
      },
    ],
  },
  {
    id: "rst-fries-republic",
    slug: "fries-republic",
    name: "Fries Republic",
    tagline: "Loaded fries, suya and late-night platters",
    cuisine: "Street Food",
    neighbourhood: "Madina",
    rating: 4.6,
    ratingCount: 860,
    deliveryFee: 8,
    etaMinutes: 25,
    distanceKm: 6.4,
    badge: "Free delivery",
    image: {
      src: "/assets/images/dish-loaded-fries.jpg",
      alt: "Loaded sweet potato fries with guacamole and sour cream, seen from above",
    },
    menu: [
      {
        id: "mi-fries-loaded",
        name: "Loaded cheese fries",
        description: "Skin-on fries, cheese sauce, spring onion and suya dust",
        price: 28,
        image: {
          src: "/assets/images/dish-loaded-fries.jpg",
          alt: "Loaded sweet potato fries with guacamole and sour cream, seen from above",
        },
        popular: true,
        vegetarian: false,
      },
      {
        id: "mi-fries-suya",
        name: "Suya skewers",
        description: "Beef skewers rolled in groundnut and shito",
        price: 35,
        image: {
          src: "/assets/images/dish-bbq.jpg",
          alt: "Grilled meat skewers laid on paper with peppers and dipping sauces",
        },
        popular: true,
        vegetarian: false,
      },
      {
        id: "mi-fries-wings",
        name: "Hot wings",
        description: "Eight wings in sticky kankankan glaze",
        price: 32,
        image: {
          src: "/assets/images/dish-bbq.jpg",
          alt: "Grilled meat skewers laid on paper with peppers and dipping sauces",
        },
        popular: false,
        vegetarian: false,
      },
      {
        id: "mi-fries-plantain",
        name: "Sweet plantain chips",
        description: "Crisp plantain chips with pepper salt",
        price: 15,
        image: {
          src: "/assets/images/dish-loaded-fries.jpg",
          alt: "Loaded sweet potato fries with guacamole and sour cream, seen from above",
        },
        popular: false,
        vegetarian: true,
      },
    ],
  },
  {
    id: "rst-buka-24",
    slug: "buka-24",
    name: "Buka 24",
    tagline: "Grill, tilapia and open until sunrise",
    cuisine: "Grill",
    neighbourhood: "Airport Residential",
    rating: 4.7,
    ratingCount: 1940,
    deliveryFee: 20,
    etaMinutes: 35,
    distanceKm: 11.8,
    badge: "Open 24 hours",
    discount: { label: "15% off", percent: 15 },
    image: {
      src: "/assets/images/dish-bbq.jpg",
      alt: "Grilled meat skewers laid on paper with peppers and dipping sauces",
    },
    menu: [
      {
        id: "mi-buka-suya",
        name: "Suya platter",
        description: "Beef skewers, gari, onion, tomato and fried plantain",
        price: 60,
        image: {
          src: "/assets/images/dish-bbq.jpg",
          alt: "Grilled meat skewers laid on paper with peppers and dipping sauces",
        },
        popular: true,
        vegetarian: false,
      },
      {
        id: "mi-buka-tilapia",
        name: "Grilled tilapia & banku",
        description: "Whole tilapia with banku and shito sauce",
        price: 75,
        image: {
          src: "/assets/images/dish-prawn-stew.jpg",
          alt: "Prawns in a brown stew served with white rice and coriander",
        },
        popular: false,
        vegetarian: false,
      },
      {
        id: "mi-buka-jollof",
        name: "Jollof with grilled prawns",
        description: "Smoky jollof, prawns, plantain and coleslaw",
        price: 55,
        image: {
          src: "/assets/images/dish-fried-rice.jpg",
          alt: "Fried rice with chicken, sweetcorn and spring onion on a square plate",
        },
        popular: false,
        vegetarian: false,
      },
      {
        id: "mi-buka-veggie",
        name: "Grilled halloumi & pepper sauce",
        description: "Charred halloumi, roasted pepper and tomato salad",
        price: 42,
        image: {
          src: "/assets/images/dish-plated-mains.jpg",
          alt: "Three plated dishes on dark ceramic plates beside a dipping sauce",
        },
        popular: false,
        vegetarian: true,
      },
    ],
  },
  {
    id: "rst-cocoa-house",
    slug: "cocoa-house",
    name: "Cocoa House",
    tagline: "Coastal seafood, cooked over open flame",
    cuisine: "Seafood",
    neighbourhood: "Labadi",
    rating: 4.9,
    ratingCount: 620,
    deliveryFee: 18,
    etaMinutes: 40,
    distanceKm: 2.1,
    badge: "Chef's pick",
    image: {
      src: "/assets/images/dish-prawn-stew.jpg",
      alt: "Prawns in a brown stew served with white rice and coriander",
    },
    menu: [
      {
        id: "mi-cocoa-prawns",
        name: "Prawns in brown stew",
        description: "Tiger prawns, house brown stew, rice and coriander",
        price: 70,
        image: {
          src: "/assets/images/dish-prawn-stew.jpg",
          alt: "Prawns in a brown stew served with white rice and coriander",
        },
        popular: true,
        vegetarian: false,
      },
      {
        id: "mi-cocoa-lobster",
        name: "Grilled lobster",
        description: "Half lobster, garlic butter, charred lemon and fries",
        price: 120,
        image: {
          src: "/assets/images/dish-plated-mains.jpg",
          alt: "Three plated dishes on dark ceramic plates beside a dipping sauce",
        },
        popular: false,
        vegetarian: false,
      },
      {
        id: "mi-cocoa-fish",
        name: "Fish & chips",
        description: "Battered local fish, triple-cooked chips, mushy peas",
        price: 45,
        image: {
          src: "/assets/images/dish-loaded-fries.jpg",
          alt: "Loaded sweet potato fries with guacamole and sour cream, seen from above",
        },
        popular: false,
        vegetarian: false,
      },
      {
        id: "mi-cocoa-okro",
        name: "Okro soup",
        description: "Okro, smoked fish, palm oil and banku",
        price: 38,
        image: {
          src: "/assets/images/dish-fried-rice.jpg",
          alt: "Fried rice with chicken, sweetcorn and spring onion on a square plate",
        },
        popular: false,
        vegetarian: false,
      },
    ],
  },
  {
    id: "rst-terrace-labadi",
    slug: "the-terrace-at-labadi",
    name: "The Terrace at Labadi",
    tagline: "Sea view dining, open late",
    cuisine: "Continental",
    neighbourhood: "Labadi",
    rating: 4.5,
    ratingCount: 940,
    deliveryFee: 25,
    etaMinutes: 45,
    distanceKm: 2.4,
    image: {
      src: "/assets/images/restaurant-table-service.jpg",
      alt: "A plated fish dish being served at a restaurant table set with wine glasses",
    },
    menu: [
      {
        id: "mi-terrace-salmon",
        name: "Grilled salmon",
        description: "Atlantic salmon, crushed potato and charred greens",
        price: 85,
        image: {
          src: "/assets/images/dish-plated-mains.jpg",
          alt: "Three plated dishes on dark ceramic plates beside a dipping sauce",
        },
        popular: true,
        vegetarian: false,
      },
      {
        id: "mi-terrace-steak",
        name: "Steak frites",
        description: "Char-grilled sirloin, pepper sauce and fries",
        price: 95,
        image: {
          src: "/assets/images/dish-plated-mains.jpg",
          alt: "Three plated dishes on dark ceramic plates beside a dipping sauce",
        },
        popular: false,
        vegetarian: false,
      },
      {
        id: "mi-terrace-salad",
        name: "Caesar salad",
        description: "Cos lettuce, parmesan, croutons and anchovy dressing",
        price: 35,
        image: {
          src: "/assets/images/dish-brunch-spread.jpg",
          alt: "A table spread of brunch plates, avocado toast and fresh juice",
        },
        popular: false,
        vegetarian: false,
      },
      {
        id: "mi-terrace-cocktail",
        name: "Craft cocktail",
        description: "House gin, bitters and grapefruit",
        price: 30,
        image: {
          src: "/assets/images/dish-brunch-spread.jpg",
          alt: "A table spread of brunch plates, avocado toast and fresh juice",
        },
        popular: false,
        vegetarian: true,
      },
    ],
  },
  {
    id: "rst-santoku",
    slug: "santoku-accra",
    name: "Santoku Accra",
    tagline: "Japanese kitchen in the airport district",
    cuisine: "Continental",
    neighbourhood: "Airport Residential",
    rating: 4.6,
    ratingCount: 480,
    deliveryFee: 22,
    etaMinutes: 40,
    distanceKm: 12.6,
    image: {
      src: "/assets/images/dish-plated-mains.jpg",
      alt: "Three plated dishes on dark ceramic plates beside a dipping sauce",
    },
    menu: [
      {
        id: "mi-santoku-katsu",
        name: "Chicken katsu curry",
        description: "Panko chicken, Japanese curry, rice and pickles",
        price: 55,
        image: {
          src: "/assets/images/dish-plated-mains.jpg",
          alt: "Three plated dishes on dark ceramic plates beside a dipping sauce",
        },
        popular: true,
        vegetarian: false,
      },
      {
        id: "mi-santoku-ramen",
        name: "Miso ramen",
        description: "Miso broth, pork chashu, egg and corn",
        price: 48,
        image: {
          src: "/assets/images/dish-prawn-stew.jpg",
          alt: "Prawns in a brown stew served with white rice and coriander",
        },
        popular: false,
        vegetarian: false,
      },
      {
        id: "mi-santoku-edamame",
        name: "Chilli edamame",
        description: "Steamed soy beans with chilli and salt",
        price: 18,
        image: {
          src: "/assets/images/dish-loaded-fries.jpg",
          alt: "Loaded sweet potato fries with guacamole and sour cream, seen from above",
        },
        popular: false,
        vegetarian: true,
      },
      {
        id: "mi-santoku-tiramisu",
        name: "Matcha tiramisu",
        description: "Mascarpone, matcha and finger biscuits",
        price: 28,
        image: {
          src: "/assets/images/dish-brunch-spread.jpg",
          alt: "A table spread of brunch plates, avocado toast and fresh juice",
        },
        popular: false,
        vegetarian: true,
      },
    ],
  },
  {
    id: "rst-burger-street",
    slug: "burger-street-osu",
    name: "Burger Street Osu",
    tagline: "Smashed burgers, quick delivery",
    cuisine: "Burgers",
    neighbourhood: "Osu",
    rating: 4.4,
    ratingCount: 1520,
    deliveryFee: 10,
    etaMinutes: 20,
    distanceKm: 0.6,
    badge: "20 min",
    image: {
      src: "/assets/images/dish-burger.jpg",
      alt: "A double cheeseburger with pickles, tomato and sauce",
    },
    menu: [
      {
        id: "mi-burger-double",
        name: "Double cheeseburger",
        description: "Two smashed patties, aged cheddar, pickles and house sauce",
        price: 42,
        image: {
          src: "/assets/images/dish-burger.jpg",
          alt: "A double cheeseburger with pickles, tomato and sauce",
        },
        popular: true,
        vegetarian: false,
      },
      {
        id: "mi-burger-crispy",
        name: "Crispy chicken burger",
        description: "Buttermilk chicken, slaw and chipotle mayo",
        price: 35,
        image: {
          src: "/assets/images/dish-burger.jpg",
          alt: "A double cheeseburger with pickles, tomato and sauce",
        },
        popular: false,
        vegetarian: false,
      },
      {
        id: "mi-burger-fries",
        name: "Cheese fries",
        description: "Fries with cheese sauce and spring onion",
        price: 22,
        image: {
          src: "/assets/images/dish-loaded-fries.jpg",
          alt: "Loaded sweet potato fries with guacamole and sour cream, seen from above",
        },
        popular: false,
        vegetarian: false,
      },
      {
        id: "mi-burger-shake",
        name: "Vanilla shake",
        description: "Thick vanilla milkshake",
        price: 18,
        image: {
          src: "/assets/images/dish-brunch-spread.jpg",
          alt: "A table spread of brunch plates, avocado toast and fresh juice",
        },
        popular: false,
        vegetarian: true,
      },
    ],
  },
  {
    id: "rst-morning-glory",
    slug: "morning-glory-cafe",
    name: "Morning Glory Café",
    tagline: "Breakfast worth waking up for",
    cuisine: "Breakfast",
    neighbourhood: "Airport Residential",
    rating: 4.6,
    ratingCount: 720,
    deliveryFee: 12,
    etaMinutes: 25,
    distanceKm: 11.2,
    image: {
      src: "/assets/images/dish-brunch-spread.jpg",
      alt: "A table spread of brunch plates, avocado toast and fresh juice",
    },
    menu: [
      {
        id: "mi-morning-toast",
        name: "Jollof egg toast",
        description: "Jollof, fried egg, avocado and chilli oil on sourdough",
        price: 32,
        image: {
          src: "/assets/images/dish-brunch-spread.jpg",
          alt: "A table spread of brunch plates, avocado toast and fresh juice",
        },
        popular: true,
        vegetarian: false,
      },
      {
        id: "mi-morning-banku",
        name: "Banku & beans",
        description: "Rice and beans, wele, shito and a boiled egg",
        price: 26,
        image: {
          src: "/assets/images/dish-fried-rice.jpg",
          alt: "Fried rice with chicken, sweetcorn and spring onion on a square plate",
        },
        popular: false,
        vegetarian: false,
      },
      {
        id: "mi-morning-avocado",
        name: "Avocado toast",
        description: "Sourdough, smashed avocado, tomato and dukkah",
        price: 28,
        image: {
          src: "/assets/images/dish-brunch-spread.jpg",
          alt: "A table spread of brunch plates, avocado toast and fresh juice",
        },
        popular: false,
        vegetarian: true,
      },
      {
        id: "mi-morning-coffee",
        name: "Iced coffee",
        description: "Single-origin filter, condensed milk, over ice",
        price: 16,
        image: {
          src: "/assets/images/dish-brunch-spread.jpg",
          alt: "A table spread of brunch plates, avocado toast and fresh juice",
        },
        popular: false,
        vegetarian: true,
      },
    ],
  },
  {
    id: "rst-napoli",
    slug: "napoli-pizzeria",
    name: "Napoli Pizzeria",
    tagline: "Wood-fired, thin crust, very fast",
    cuisine: "Pizza",
    neighbourhood: "Osu",
    rating: 4.5,
    ratingCount: 1100,
    deliveryFee: 12,
    etaMinutes: 25,
    distanceKm: 1.1,
    image: {
      src: "/assets/images/dish-pizza.jpg",
      alt: "A thin-crust pizza with chicken, pineapple and coriander on a board",
    },
    menu: [
      {
        id: "mi-napoli-margherita",
        name: "Margherita",
        description: "San Marzano tomato, fior di latte and basil",
        price: 45,
        image: {
          src: "/assets/images/dish-pizza.jpg",
          alt: "A thin-crust pizza with chicken, pineapple and coriander on a board",
        },
        popular: true,
        vegetarian: true,
      },
      {
        id: "mi-napoli-pepperoni",
        name: "Pepperoni",
        description: "Tomato, mozzarella and spiced pepperoni",
        price: 52,
        image: {
          src: "/assets/images/dish-pizza.jpg",
          alt: "A thin-crust pizza with chicken, pineapple and coriander on a board",
        },
        popular: false,
        vegetarian: false,
      },
      {
        id: "mi-napoli-bbq",
        name: "BBQ chicken",
        description: "Smoked chicken, red onion, sweetcorn and barbecue sauce",
        price: 55,
        image: {
          src: "/assets/images/dish-pizza.jpg",
          alt: "A thin-crust pizza with chicken, pineapple and coriander on a board",
        },
        popular: false,
        vegetarian: false,
      },
      {
        id: "mi-napoli-tiramisu",
        name: "Tiramisu",
        description: "Mascarpone, coffee and cocoa",
        price: 20,
        image: {
          src: "/assets/images/dish-brunch-spread.jpg",
          alt: "A table spread of brunch plates, avocado toast and fresh juice",
        },
        popular: false,
        vegetarian: true,
      },
    ],
  },
];

/**
 * The line under a dish's name.
 *
 * Appetite, not information: the kitchen's own words are for the menu, this is
 * for the banner.
 */
const TAGLINES_BY_CUISINE: Record<Cuisine, string[]> = {
  Ghanaian: [
    "Specially made for you",
    "Cooked to order, eaten warm",
    "Every bit of it",
  ],
  "Street Food": [
    "Made hot, sold fast",
    "The one you come back for",
    "Enjoy every bite",
  ],
  Grill: [
    "Over the coals, just for you",
    "Smoke it, then eat it",
    "Grilled the way it should be",
  ],
  Seafood: [
    "Straight from the catch",
    "Cooked over open flame",
    "Taste the sea",
  ],
  Continental: [
    "Carefully put together",
    "A little treat, made fresh",
    "Plated for tonight",
  ],
  Pizza: [
    "Baked fresh, folded hot",
    "Made for sharing, or not",
    "Straight from the oven",
  ],
  Burgers: [
    "Stacked to order",
    "Hot off the grill",
    "One for now, one later",
  ],
  Breakfast: [
    "Made this morning",
    "The slow, good start",
    "Worth waking up for",
  ],
};

/**
 * The kitchens, with every dish carrying the portions it comes in and the
 * extras that can be added to it.
 */
export const restaurants: Restaurant[] = seeds.map((restaurant, index) => ({
  ...restaurant,
  menu: restaurant.menu.map((item, itemIndex) => {
    const taglines = TAGLINES_BY_CUISINE[restaurant.cuisine];

    return {
      ...item,
      sizes: sizesFor(item.price),
      toppings: TOPPINGS_BY_CUISINE[restaurant.cuisine],
      tagline: taglines[(index + itemIndex) % taglines.length],
    };
  }),
}));
