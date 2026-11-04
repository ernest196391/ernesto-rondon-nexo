// Menú de Panda26. Para cambiar un precio o un producto, se cambia SOLO aquí.
// Fuente: menú escrito que Panda26 mandó el 3-nov-2026 (los precios de la pizarra son más viejos).
// estudio = foto de estudio (IA a partir de su foto real); giro = 36 fotogramas del giro 360° en una hoja 6×6.
// El sándwich de jamón y queso NO tiene foto real todavía: su foto de estudio la hizo la IA (cambiarla cuando la manden).
window.PANDA_MENU = {
  negocio: "Panda26",
  whatsapp: "5363694210",
  horario: "Todos los días · 10:00 a.m. – 8:00 p.m.",
  aviso: "Todos los combos incluyen papas fritas + salsas sin costo extra",
  categorias: [
    {
      id: "combos",
      nombre: "Combos",
      icono: "combo",
      nota: "Incluye papas fritas + salsas",
      productos: [
        { id: "hotdog-res", nombre: "Hot Dog 100% Res", precio: 4000, estudio: "img/estudio/hotdog-res.webp", giro: "giros/hotdog-res.webp", frase: "Salchicha 100 % de res, mostaza y kétchup" },
        { id: "pan-croquetas", nombre: "Pan con Croquetas", precio: 2500, estudio: "img/estudio/pan-croquetas.webp", giro: "giros/pan-croquetas.webp", frase: "El clásico cubano, crujiente por fuera" },
        { id: "sandwich-jq", nombre: "Sándwich de Jamón y Queso", precio: 2800, estudio: "img/estudio/sandwich-jq.webp", giro: "giros/sandwich-jq.webp", frase: "Jamón y queso derretido en pan suave" },
        { id: "hotdog-mixto", nombre: "Hot Dog Mixto", precio: 2000, estudio: "img/estudio/hotdog-mixto.webp", giro: "giros/hotdog-mixto.webp", frase: "El de siempre, con todo" }
      ]
    },
    {
      id: "bebidas",
      nombre: "Bebidas",
      icono: "vaso",
      productos: [
        { id: "frappe-guayaba", nombre: "Frappé de Guayaba", precio: 700, estudio: "img/estudio/frappe.webp", giro: "giros/frappe.webp", frase: "Guayaba natural, bien fría" },
        { id: "refresco", nombre: "Refresco (Naranja / Cola)", precio: 650, icono: "lata" },
        { id: "cerveza", nombre: "Cerveza", precio: 700, icono: "lata" },
        { id: "agua-milan", nombre: "Agua Milan", precio: 350, icono: "botella" },
        { id: "agua-mondariz", nombre: "Agua Mondariz", precio: 450, icono: "botella" }
      ]
    },
    {
      id: "agregos",
      nombre: "Agregos",
      icono: "papas",
      productos: [
        { id: "papas", nombre: "Papas fritas", precio: 900 },
        { id: "croquetas", nombre: "Croquetas", precio: 900, icono: "croqueta" }
      ]
    },
    {
      id: "acompanar",
      nombre: "Para acompañar",
      icono: "bol",
      productos: [
        { id: "ensaladilla", nombre: "Ensaladilla Fría", precio: 900 },
        { id: "coctel-fruta", nombre: "Cóctel de Fruta", precio: 500 }
      ]
    },
    {
      id: "salsas",
      nombre: "Salsas",
      icono: "salsa",
      nota: "Kétchup, mostaza y mayonesa van gratis con los combos",
      productos: [
        { id: "miel-mostaza", nombre: "Miel y Mostaza", precio: 100 },
        { id: "yogurt", nombre: "Aderezo de Yogurt", precio: 100 },
        { id: "relish", nombre: "Salsa Relish", precio: 300 }
      ]
    }
  ]
};
