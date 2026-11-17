/**
 * The covers a kitchen can pick.
 *
 * The photography is real and catalogued with its licence in
 * docs/assets-provenance.md. The alt text describes what is actually in the
 * frame, because the cover is the first sight of the kitchen a customer gets.
 */
export const COVER_IMAGES: { src: string; alt: string }[] = [
  {
    src: "/assets/images/dish-fried-rice.jpg",
    alt: "Fried rice with chicken, sweetcorn and spring onion",
  },
  {
    src: "/assets/images/dish-prawn-stew.jpg",
    alt: "Prawns in a brown stew with white rice and coriander",
  },
  {
    src: "/assets/images/dish-bbq.jpg",
    alt: "Grilled meat skewers with peppers and dipping sauces",
  },
  {
    src: "/assets/images/dish-burger.jpg",
    alt: "A double cheeseburger with pickles and tomato",
  },
  {
    src: "/assets/images/dish-pizza.jpg",
    alt: "A thin-crust pizza with chicken and pineapple on a board",
  },
  {
    src: "/assets/images/dish-loaded-fries.jpg",
    alt: "Loaded sweet potato fries with guacamole and sour cream",
  },
  {
    src: "/assets/images/dish-brunch-spread.jpg",
    alt: "A table spread of brunch plates, avocado toast and juice",
  },
  {
    src: "/assets/images/dish-plated-mains.jpg",
    alt: "Three plated dishes on dark ceramic plates",
  },
  {
    src: "/assets/images/restaurant-interior.jpg",
    alt: "A modern dining room set with dark leather seating",
  },
  {
    src: "/assets/images/restaurant-table-service.jpg",
    alt: "A plated fish dish served at a table set with wine glasses",
  },
];

/** The cover a kitchen is allowed to pick, with the alt text that goes with it. */
export function findCover(src: string): { src: string; alt: string } | undefined {
  return COVER_IMAGES.find((cover) => cover.src === src);
}
