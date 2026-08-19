const items=[
["Casa Viva","Comercio y operaciones","Proyecto de comercio para el hogar. Su evolución digital integra catálogo, pedidos, logística, gestores y administración."],
["Triciclub","Movilidad y marketplace","Plataforma en desarrollo para el ecosistema de triciclos: pasajeros, carga, envíos y negocios."],
["Nexo","Construcción de negocios con IA","Sistema operativo para transformar ideas en oportunidades investigadas, ofertas, productos y experimentos medibles."],
["PREVENTE","Operación empresarial","Experiencia empresarial y administrativa que forma parte del recorrido de construcción y aprendizaje."]
];
export default function Page(){return <main className="section"><div className="eyebrow">Portfolio empresarial</div><h1>Lo que estoy construyendo.</h1><div className="grid">{items.map(x=><div className="card" key={x[0]}><div className="tag">{x[1]}</div><h3>{x[0]}</h3><p className="muted">{x[2]}</p></div>)}</div></main>}
