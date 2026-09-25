import { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabaseClient";

const categoryInfo = {
  Roupas: {
    description:
      "Camisetas dry-fit, leggings de compressão, shorts e regatas técnicas.",
    icon: (
      <svg
        width="30"
        height="30"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      >
        <path d="M20 6L9 17l-5-5" />
      </svg>
    ),
  },

  Acessórios: {
    description:
      "Cintos de couro, straps, luvas, munhequeiras e joelheiras.",
    icon: (
      <svg
        width="30"
        height="30"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      >
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },

  Suplementos: {
    description:
      "Whey, creatina, pré-treino e aminoácidos com origem rastreada.",
    icon: (
      <svg
        width="30"
        height="30"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      >
        <path d="M4 21V9a2 2 0 012-2h12a2 2 0 012 2v12" />
        <path d="M9 21V13h6v8" />
      </svg>
    ),
  },

  Equipamentos: {
    description:
      "Halteres, barras olímpicas, kettlebells, bancos e anilhas.",
    icon: (
      <svg
        width="30"
        height="30"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      >
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="12" r="3" />
        <line x1="9" y1="12" x2="15" y2="12" />
      </svg>
    ),
  },
};

const categoryOrder = [
  "Roupas",
  "Acessórios",
  "Suplementos",
  "Equipamentos",
];

function formatPrice(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function App() {
  const [produtos, setProdutos] = useState([]);
  const [categorias, setCategorias] = useState([]);

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [categoriaAtiva, setCategoriaAtiva] = useState("Todos");

  const [carrinho, setCarrinho] = useState([]);
  const [carrinhoAberto, setCarrinhoAberto] = useState(false);

  const [menuAberto, setMenuAberto] = useState(false);

  const [checkoutAberto, setCheckoutAberto] = useState(false);
  const [checkoutMensagem, setCheckoutMensagem] = useState("");

  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterMensagem, setNewsletterMensagem] = useState("");

  const [placasAtivas, setPlacasAtivas] = useState(0);
  const [progresso, setProgresso] = useState(0);

  // =========================================================
  // SUPABASE
  // =========================================================

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    setCarregando(true);
    setErro("");

    const [produtosResult, categoriasResult] = await Promise.all([
      supabase
        .from("produtos")
        .select(`
          id,
          nome,
          descricao,
          preco,
          imagem,
          estoque,
          categorias (
            id,
            nome
          )
        `)
        .order("id", { ascending: true }),

      supabase
        .from("categorias")
        .select("id, nome, descricao")
        .order("id", { ascending: true }),
    ]);

    if (produtosResult.error) {
      console.error(produtosResult.error);
      setErro(produtosResult.error.message);
      setProdutos([]);
    } else {
      console.log("Produtos recebidos do Supabase:", produtosResult.data);
      setProdutos(produtosResult.data || []);
    }

    if (!categoriasResult.error) {
      setCategorias(categoriasResult.data || []);
    }

    setCarregando(false);
  }

  // =========================================================
  // PRODUTOS FILTRADOS
  // =========================================================

  const produtosFiltrados = useMemo(() => {
    if (categoriaAtiva === "Todos") {
      return produtos;
    }

    return produtos.filter(
      (produto) => produto.categorias?.nome === categoriaAtiva
    );
  }, [produtos, categoriaAtiva]);

  // =========================================================
  // CARRINHO
  // =========================================================

  function adicionarCarrinho(produto) {
    setCarrinho((carrinhoAtual) => {
      const existente = carrinhoAtual.find(
        (item) => item.id === produto.id
      );

      if (existente) {
        return carrinhoAtual.map((item) =>
          item.id === produto.id
            ? { ...item, quantidade: item.quantidade + 1 }
            : item
        );
      }

      return [
        ...carrinhoAtual,
        {
          ...produto,
          quantidade: 1,
        },
      ];
    });

    setCarrinhoAberto(true);
  }

  function removerCarrinho(id) {
    setCarrinho((atual) =>
      atual.filter((produto) => produto.id !== id)
    );
  }

  function alterarQuantidade(id, valor) {
    setCarrinho((atual) =>
      atual.map((produto) => {
        if (produto.id !== id) return produto;

        return {
          ...produto,
          quantidade: Math.max(1, produto.quantidade + valor),
        };
      })
    );
  }

  const quantidadeCarrinho = carrinho.reduce(
    (total, produto) => total + produto.quantidade,
    0
  );

  const totalCarrinho = carrinho.reduce(
    (total, produto) =>
      total + Number(produto.preco) * produto.quantidade,
    0
  );

  // =========================================================
  // CATEGORIA
  // =========================================================

  function selecionarCategoria(categoria) {
    setCategoriaAtiva(categoria);

    setTimeout(() => {
      document
        .getElementById("produtos")
        ?.scrollIntoView({
          behavior: "smooth",
        });
    }, 50);
  }

  // =========================================================
  // NEWSLETTER
  // =========================================================

  function cadastrarNewsletter(event) {
    event.preventDefault();

    if (!newsletterEmail) return;

    setNewsletterMensagem(
      `INSCRITO COM SUCESSO — CONFIRMAÇÃO ENVIADA PARA ${newsletterEmail.toUpperCase()}`
    );

    setNewsletterEmail("");
  }

  // =========================================================
  // CHECKOUT
  // =========================================================

  function finalizarCompra(event) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const nome = formData.get("nome");
    const email = formData.get("email");
    const endereco = formData.get("endereco");

    if (!nome || !email || !endereco) return;

    const pedido = Date.now().toString(36).toUpperCase();

    setCheckoutMensagem(
      `Pedido ${pedido} recebido! Enviaremos confirmação para ${email.toUpperCase()}.`
    );

    setCarrinho([]);

    setTimeout(() => {
      setCheckoutAberto(false);
      setCheckoutMensagem("");
      setCarrinhoAberto(true);
    }, 1800);
  }

  // =========================================================
  // SCROLL BARBELL
  // =========================================================

  useEffect(() => {
    function atualizarBarra() {
      const alturaDocumento =
        document.documentElement.scrollHeight -
        window.innerHeight;

      if (alturaDocumento <= 0) {
        setProgresso(0);
        setPlacasAtivas(0);
        return;
      }

      const porcentagem = Math.min(
        1,
        Math.max(0, window.scrollY / alturaDocumento)
      );

      setProgresso(Math.round(porcentagem * 100));
      setPlacasAtivas(Math.round(porcentagem * 10));
    }

    window.addEventListener("scroll", atualizarBarra, {
      passive: true,
    });

    window.addEventListener("resize", atualizarBarra);

    atualizarBarra();

    return () => {
      window.removeEventListener("scroll", atualizarBarra);
      window.removeEventListener("resize", atualizarBarra);
    };
  }, []);

  // =========================================================
  // CATEGORIAS PARA EXIBIÇÃO
  // =========================================================

  const categoriasExibidas = categoryOrder.map((nome) => {
    const categoriaBanco = categorias.find(
      (categoria) => categoria.nome === nome
    );

    return {
      nome,
      descricao:
        categoriaBanco?.descricao ||
        categoryInfo[nome]?.description ||
        "",
      icon: categoryInfo[nome]?.icon,
    };
  });

  // =========================================================
  // TELA
  // =========================================================

  return (
    <div className="min-h-screen bg-iron text-chalk font-body antialiased">
      {/* =====================================================
          BARRA LATERAL DE PESO
      ====================================================== */}

      <div className="hidden lg:flex fixed right-6 top-1/2 -translate-y-1/2 z-40 flex-col items-center select-none pointer-events-none">
        <div className="w-2 h-2 rounded-full bg-steel mb-1" />

        <div className="relative w-3 h-72 plate-track rounded-full overflow-visible flex flex-col justify-end items-center">
          <div className="flex flex-col-reverse items-center gap-[3px]">
            {Array.from({ length: 10 }).map((_, index) => (
              <div
                key={index}
                className="plate w-7 h-[10px] rounded-[2px]"
                style={{
                  backgroundColor:
                    index < placasAtivas ? "#FF5A1F" : "#3C362C",
                  opacity: index < placasAtivas ? 1 : 0.2,
                  transform:
                    index < placasAtivas
                      ? "scaleX(1)"
                      : "scaleX(0.4)",
                }}
              />
            ))}
          </div>
        </div>

        <div className="w-2 h-2 rounded-full bg-steel mt-1" />

        <span className="mt-3 font-mono text-[10px] tracking-widest text-bar">
          {String(progresso).padStart(3, "0")}KG
        </span>
      </div>

      {/* =====================================================
          NAVBAR
      ====================================================== */}

      <header className="fixed top-0 inset-x-0 z-30 backdrop-blur bg-iron/85 border-b border-steel/60">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 h-16 flex items-center justify-between">
          <a
            href="#top"
            className="font-display text-2xl tracking-wide text-chalk"
          >
            FORJA
          </a>

          <nav className="hidden md:flex items-center gap-8 font-body text-sm tracking-wide text-chalk/80">
            {categoryOrder.map((categoria) => (
              <button
                key={categoria}
                onClick={() => selecionarCategoria(categoria)}
                className="hover:text-forge transition-colors"
              >
                {categoria}
              </button>
            ))}

            <a
              href="#produtos"
              className="hover:text-forge transition-colors"
            >
              Produtos
            </a>
          </nav>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setCarrinhoAberto(true)}
              className="relative flex items-center gap-2 border border-steel px-3 py-2 text-sm font-mono hover:border-forge transition-colors"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>

              <span className="hidden sm:inline">CARRINHO</span>

              <span className="ml-1 bg-forge text-iron rounded-full w-5 h-5 grid place-items-center text-xs font-bold">
                {quantidadeCarrinho}
              </span>
            </button>

            <button
              onClick={() => setMenuAberto(!menuAberto)}
              className="md:hidden p-2"
              aria-label="Abrir menu"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {menuAberto && (
          <nav className="md:hidden flex flex-col border-t border-steel/60 bg-iron px-5 py-4 gap-4 text-sm">
            {categoryOrder.map((categoria) => (
              <button
                key={categoria}
                onClick={() => {
                  setMenuAberto(false);
                  selecionarCategoria(categoria);
                }}
                className="py-1 text-left"
              >
                {categoria}
              </button>
            ))}

            <a
              href="#produtos"
              onClick={() => setMenuAberto(false)}
              className="py-1"
            >
              Produtos
            </a>
          </nav>
        )}
      </header>

      {/* =====================================================
          HERO
      ====================================================== */}

      <section
        id="top"
        className="relative overflow-hidden pt-32 pb-24 lg:pt-44 lg:pb-32 border-b border-steel/60 grain"
      >
        <div className="max-w-7xl mx-auto px-5 lg:px-8 relative z-10">
          <p className="font-mono text-forge text-xs tracking-[0.3em] mb-5">
            ROUPAS · ACESSÓRIOS · SUPLEMENTOS · EQUIPAMENTOS
          </p>

          <h1 className="font-display leading-[0.9] tracking-wide">
            <span className="block text-[15vw] lg:text-[7.5rem] text-chalk">
              FORJA SEU
            </span>

            <span className="block text-[15vw] lg:text-[7.5rem] text-outline">
              LIMITE
            </span>
          </h1>

          <p className="mt-8 max-w-xl text-chalk/70 text-base lg:text-lg">
            Tudo o que sustenta uma rotina de treino séria, numa loja só.
            Selecionamos peça por peça, pote por pote, disco por disco —
            pensando em quem carrega carga de verdade.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <a
              href="#produtos"
              className="bg-forge text-iron font-semibold px-7 py-3.5 hover:bg-rust transition-colors"
            >
              Ver produtos
            </a>

            <a
              href="#categorias"
              className="border border-steel px-7 py-3.5 hover:border-chalk transition-colors"
            >
              Explorar categorias
            </a>
          </div>
        </div>

        <div className="absolute -bottom-10 -right-10 lg:right-10 opacity-10 lg:opacity-20 pointer-events-none">
          <svg
            width="360"
            height="360"
            viewBox="0 0 100 100"
            fill="none"
            stroke="#ECE7DE"
            strokeWidth="1.2"
          >
            <circle cx="50" cy="50" r="44" />
            <circle cx="50" cy="50" r="30" />
            <circle cx="50" cy="50" r="12" />
          </svg>
        </div>
      </section>

      {/* =====================================================
          ESTATÍSTICAS
      ====================================================== */}

      <section className="border-b border-steel/60 bg-plate">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 py-8 grid grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <p className="font-display text-3xl lg:text-4xl text-forge">
              12K+
            </p>
            <p className="text-xs tracking-widest text-chalk/60 font-mono mt-1">
              CLIENTES ATIVOS
            </p>
          </div>

          <div>
            <p className="font-display text-3xl lg:text-4xl text-forge">
              8 ANOS
            </p>
            <p className="text-xs tracking-widest text-chalk/60 font-mono mt-1">
              DE MERCADO
            </p>
          </div>

          <div>
            <p className="font-display text-3xl lg:text-4xl text-forge">
              420+
            </p>
            <p className="text-xs tracking-widest text-chalk/60 font-mono mt-1">
              PRODUTOS ATIVOS
            </p>
          </div>

          <div>
            <p className="font-display text-3xl lg:text-4xl text-forge">
              BR
            </p>
            <p className="text-xs tracking-widest text-chalk/60 font-mono mt-1">
              ENTREGA NACIONAL
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================
          CATEGORIAS
      ====================================================== */}

      <section
        id="categorias"
        className="border-y border-steel/60 bg-plate relative overflow-hidden"
      >
        <div className="max-w-7xl mx-auto px-5 lg:px-8 py-24 lg:py-28 relative z-10">
          <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
            <h2 className="font-display text-4xl lg:text-5xl">
              CATEGORIAS
            </h2>

            <p className="text-chalk/60 max-w-sm text-sm">
              Quatro frentes, um objetivo: te dar estrutura pra treinar
              sem desculpa.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {categoriasExibidas.map((categoria) => (
              <button
                key={categoria.nome}
                onClick={() => selecionarCategoria(categoria.nome)}
                className={`group text-left border bg-plate p-6 flex flex-col justify-between min-h-[240px] cursor-pointer card-hover ${
                  categoriaAtiva === categoria.nome
                    ? "border-forge"
                    : "border-steel"
                }`}
              >
                <div>
                  <div className="text-forge">
                    {categoria.icon}
                  </div>

                  <h3 className="font-display text-2xl mt-5">
                    {categoria.nome.toUpperCase()}
                  </h3>
                </div>

                <p className="text-sm text-chalk/60">
                  {categoria.descricao}
                </p>

                <span className="mt-4 font-mono text-[10px] tracking-widest text-forge opacity-0 group-hover:opacity-100 transition-opacity">
                  VER PRODUTOS →
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================
          PRODUTOS
      ====================================================== */}

      <section
        id="produtos"
        className="border-y border-steel/60 bg-plate relative overflow-hidden"
      >
        <div className="max-w-7xl mx-auto px-5 lg:px-8 py-24 lg:py-28 relative z-10">
          <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
            <h2 className="font-display text-4xl lg:text-5xl">
              {categoriaAtiva === "Todos"
                ? "TODOS OS PRODUTOS"
                : categoriaAtiva.toUpperCase()}
            </h2>

            <p className="text-chalk/60 max-w-sm text-sm">
              Escolhidos pela comunidade, testados na prática.
            </p>
          </div>

          {/* FILTROS */}

          <div className="flex flex-wrap gap-2 mb-10">
            <button
              onClick={() => setCategoriaAtiva("Todos")}
              className={`filter-chip font-mono text-xs tracking-widest px-4 py-2 border transition-colors ${
                categoriaAtiva === "Todos"
                  ? "bg-forge text-iron border-forge"
                  : "border-steel text-chalk/70 hover:border-forge"
              }`}
            >
              TODOS
            </button>

            {categoryOrder.map((categoria) => (
              <button
                key={categoria}
                onClick={() => setCategoriaAtiva(categoria)}
                className={`filter-chip font-mono text-xs tracking-widest px-4 py-2 border transition-colors ${
                  categoriaAtiva === categoria
                    ? "bg-forge text-iron border-forge"
                    : "border-steel text-chalk/70 hover:border-forge"
                }`}
              >
                {categoria.toUpperCase()}
              </button>
            ))}
          </div>

          {/* CARREGANDO */}

          {carregando && (
            <div className="py-20 text-center">
              <p className="font-mono text-forge text-sm">
                CARREGANDO PRODUTOS DO SUPABASE...
              </p>
            </div>
          )}

          {/* ERRO */}

          {!carregando && erro && (
            <div className="border border-red-900 bg-red-950/30 p-6">
              <p className="font-mono text-red-400 text-sm">
                ERRO AO CARREGAR OS PRODUTOS
              </p>

              <p className="text-chalk/60 mt-2 text-sm">
                {erro}
              </p>
            </div>
          )}

          {/* GRID */}

          {!carregando &&
            !erro &&
            produtosFiltrados.length > 0 && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {produtosFiltrados.map((produto) => (
                  <article
                    key={produto.id}
                    className="card-hover border border-steel bg-iron p-5 flex flex-col"
                  >
                    <div className="aspect-square w-full rounded-2xl border border-steel/60 mb-4 bg-[#191818] overflow-hidden">
                      {produto.imagem ? (
                        <img
                          src={`/${produto.imagem}`}
                          alt={produto.nome}
                          className="w-full h-full object-cover"
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full grid place-items-center text-chalk/20 font-mono text-xs">
                          SEM IMAGEM
                        </div>
                      )}
                    </div>

                    <p className="font-mono text-[10px] tracking-widest text-forge mb-1">
                      {produto.categorias?.nome?.toUpperCase() ||
                        "PRODUTO"}
                    </p>

                    <h3 className="font-body font-semibold leading-snug mb-3">
                      {produto.nome}
                    </h3>

                    {produto.descricao && (
                      <p className="text-sm text-chalk/50 mb-4 line-clamp-2">
                        {produto.descricao}
                      </p>
                    )}

                    <div className="mt-auto flex items-center justify-between gap-3">
                      <span className="font-mono text-sm">
                        {formatPrice(produto.preco)}
                      </span>

                      <button
                        onClick={() => adicionarCarrinho(produto)}
                        className="text-xs font-semibold border border-steel px-3 py-2 hover:border-forge hover:text-forge transition-colors"
                      >
                        ADICIONAR
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}

          {!carregando &&
            !erro &&
            produtosFiltrados.length === 0 && (
              <p className="text-chalk/40 text-sm font-mono">
                NENHUM PRODUTO NESTA CATEGORIA NO MOMENTO.
              </p>
            )}
        </div>

        {/* ELEMENTOS DECORATIVOS */}

        <div className="absolute inset-x-0 top-0 flex items-start justify-center opacity-10 lg:opacity-20 pointer-events-none -translate-y-1/4">
          <svg
            width="2000"
            height="2000"
            viewBox="0 0 100 100"
            fill="none"
            stroke="#ECE7DE"
            strokeWidth="1.2"
          >
            <circle cx="50" cy="50" r="44" />
            <circle cx="50" cy="50" r="30" />
            <circle cx="50" cy="50" r="12" />
          </svg>
        </div>
      </section>

      {/* =====================================================
          DEPOIMENTOS
      ====================================================== */}

      <section className="max-w-7xl mx-auto px-5 lg:px-8 py-24 lg:py-28">
        <h2 className="font-display text-4xl lg:text-5xl mb-12">
          QUEM TREINA, APROVA
        </h2>

        <div className="grid md:grid-cols-3 gap-5">
          <blockquote className="border border-steel p-6 bg-plate">
            <p className="text-chalk/80 text-sm leading-relaxed">
              "Troquei de cinto e de whey na mesma semana. Entrega rápida
              e o cinto aguenta puxada pesada sem ceder."
            </p>

            <footer className="mt-5 font-mono text-xs text-forge tracking-wide">
              — RAFAEL M., POWERLIFTING
            </footer>
          </blockquote>

          <blockquote className="border border-steel p-6 bg-plate">
            <p className="text-chalk/80 text-sm leading-relaxed">
              "As leggings não marcam e não ficam transparentes nem no
              agachamento profundo. Virei cliente fixa."
            </p>

            <footer className="mt-5 font-mono text-xs text-forge tracking-wide">
              — CAMILA S., CROSS TRAINING
            </footer>
          </blockquote>

          <blockquote className="border border-steel p-6 bg-plate">
            <p className="text-chalk/80 text-sm leading-relaxed">
              "Montei o home gym inteiro por aqui. Kettlebell, banco e
              anilhas chegaram no prazo e bem embalados."
            </p>

            <footer className="mt-5 font-mono text-xs text-forge tracking-wide">
              — DIEGO A., TREINO EM CASA
            </footer>
          </blockquote>
        </div>
      </section>

      {/* =====================================================
          NEWSLETTER
      ====================================================== */}

      <section className="border-t border-steel/60 bg-plate">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 py-20 grid lg:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="font-display text-3xl lg:text-4xl">
              TREINOS E PROMOÇÕES
              <br />
              DIRETO NO SEU E-MAIL
            </h2>

            <p className="text-chalk/60 mt-4 text-sm max-w-md">
              Sem spam. Só lançamento de produto, cupom e conteúdo de
              treino uma vez por semana.
            </p>
          </div>

          <form
            onSubmit={cadastrarNewsletter}
            className="flex flex-col sm:flex-row gap-3"
          >
            <input
              type="email"
              required
              value={newsletterEmail}
              onChange={(event) =>
                setNewsletterEmail(event.target.value)
              }
              placeholder="seu@email.com"
              className="flex-1 bg-iron border border-steel px-4 py-3.5 text-sm placeholder:text-chalk/40 focus:border-forge outline-none"
            />

            <button
              type="submit"
              className="bg-forge text-iron font-semibold px-7 py-3.5 hover:bg-rust transition-colors whitespace-nowrap"
            >
              Quero receber
            </button>
          </form>

          {newsletterMensagem && (
            <p className="lg:col-span-2 font-mono text-xs text-forge">
              {newsletterMensagem}
            </p>
          )}
        </div>
      </section>

      {/* =====================================================
          FOOTER
      ====================================================== */}

      <footer className="max-w-7xl mx-auto px-5 lg:px-8 py-14 flex flex-col md:flex-row justify-between gap-8 border-t border-steel/60">
        <div>
          <p className="font-display text-2xl">FORJA</p>

          <p className="text-chalk/50 text-sm mt-2 max-w-xs">
            Roupas, acessórios, suplementos e equipamentos para quem
            treina com propósito.
          </p>
        </div>

        <div className="flex gap-16 flex-wrap">
          <div>
            <p className="font-mono text-xs tracking-widest text-chalk/40 mb-3">
              LOJA
            </p>

            <ul className="space-y-2 text-sm text-chalk/70">
              {categoryOrder.map((categoria) => (
                <li key={categoria}>
                  <button
                    onClick={() => selecionarCategoria(categoria)}
                    className="hover:text-forge"
                  >
                    {categoria}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-mono text-xs tracking-widest text-chalk/40 mb-3">
              SUPORTE
            </p>

            <ul className="space-y-2 text-sm text-chalk/70">
              <li>
                <a href="#produtos" className="hover:text-forge">
                  Trocas e devoluções
                </a>
              </li>

              <li>
                <a href="#produtos" className="hover:text-forge">
                  Frete e prazos
                </a>
              </li>

              <li>
                <a href="#top" className="hover:text-forge">
                  Fale conosco
                </a>
              </li>
            </ul>
          </div>
        </div>

        <p className="text-chalk/30 text-xs font-mono self-end">
          © 2026 FORJA — TODOS OS DIREITOS RESERVADOS
        </p>
      </footer>

      {/* =====================================================
          OVERLAY DO CARRINHO
      ====================================================== */}

      {carrinhoAberto && (
        <div
          onClick={() => setCarrinhoAberto(false)}
          className="fixed inset-0 bg-black/60 z-40"
        />
      )}

      {/* =====================================================
          CARRINHO
      ====================================================== */}

      <aside
        className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-iron border-l border-steel z-50 transition-transform duration-300 flex flex-col ${
          carrinhoAberto
            ? "translate-x-0"
            : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-steel/60">
          <h3 className="font-display text-xl">
            SEU CARRINHO
          </h3>

          <button
            onClick={() => setCarrinhoAberto(false)}
            className="text-chalk/60 hover:text-chalk"
            aria-label="Fechar carrinho"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {carrinho.length === 0 ? (
            <p className="text-chalk/40 text-sm">
              Seu carrinho está vazio. Adicione um produto para
              começar.
            </p>
          ) : (
            carrinho.map((produto) => (
              <div
                key={produto.id}
                className="flex flex-col gap-2 border-b border-steel/40 pb-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">
                      {produto.nome}
                    </p>

                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() =>
                          alterarQuantidade(produto.id, -1)
                        }
                        className="text-xs font-semibold border border-steel px-2 py-1 hover:border-forge hover:text-forge"
                      >
                        −
                      </button>

                      <span className="text-xs text-chalk/50 font-mono">
                        {produto.quantidade}
                      </span>

                      <button
                        onClick={() =>
                          alterarQuantidade(produto.id, 1)
                        }
                        className="text-xs font-semibold border border-steel px-2 py-1 hover:border-forge hover:text-forge"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <span className="font-mono text-sm">
                    {formatPrice(
                      Number(produto.preco) *
                        produto.quantidade
                    )}
                  </span>
                </div>

                <button
                  onClick={() => removerCarrinho(produto.id)}
                  className="self-start text-xs font-semibold text-chalk/60 hover:text-forge"
                >
                  Remover
                </button>
              </div>
            ))
          )}
        </div>

        <div className="px-6 py-5 border-t border-steel/60">
          <div className="flex justify-between text-sm mb-4">
            <span className="text-chalk/60">Total</span>

            <span className="font-mono font-semibold">
              {formatPrice(totalCarrinho)}
            </span>
          </div>

          <button
            onClick={() => {
              if (carrinho.length > 0) {
                setCheckoutAberto(true);
                setCarrinhoAberto(false);
              }
            }}
            className="w-full bg-forge text-iron font-semibold py-3.5 hover:bg-rust transition-colors"
          >
            Finalizar compra
          </button>
        </div>
      </aside>

      {/* =====================================================
          CHECKOUT
      ====================================================== */}

      {checkoutAberto && (
        <>
          <div
            onClick={() => setCheckoutAberto(false)}
            className="fixed inset-0 bg-black/60 z-[60]"
          />

          <div className="fixed inset-0 z-[70] flex items-center justify-center px-4">
            <div className="bg-iron border border-steel max-w-md w-full p-6 rounded-lg">
              <h4 className="font-display text-lg mb-3">
                Finalizar compra
              </h4>

              <form
                onSubmit={finalizarCompra}
                className="grid gap-3"
              >
                <input
                  name="nome"
                  required
                  placeholder="Nome completo"
                  className="bg-iron border border-steel px-3 py-2 text-sm outline-none focus:border-forge"
                />

                <input
                  name="email"
                  type="email"
                  required
                  placeholder="E-mail"
                  className="bg-iron border border-steel px-3 py-2 text-sm outline-none focus:border-forge"
                />

                <textarea
                  name="endereco"
                  required
                  placeholder="Endereço de entrega"
                  className="bg-iron border border-steel px-3 py-2 text-sm outline-none focus:border-forge"
                />

                <div className="flex items-center justify-between mt-2">
                  <button
                    type="button"
                    onClick={() => setCheckoutAberto(false)}
                    className="text-chalk/60 hover:text-chalk"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    className="bg-forge text-iron font-semibold px-4 py-2"
                  >
                    Enviar pedido
                  </button>
                </div>
              </form>

              {checkoutMensagem && (
                <p className="text-sm mt-3 font-mono text-forge">
                  {checkoutMensagem}
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default App;