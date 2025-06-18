
// 1. Seletores de Elementos DOM e Variáveis Globais

const mediaInput = document.getElementById("media");
const desvioInput = document.getElementById("desvio");
const valor1Input = document.getElementById("valor");
const valor2Input = document.getElementById("valor2");
const tipoPerguntaSelect = document.getElementById("tipoPergunta");
const valor2Container = document.getElementById("valor2-container");
const calcularBtn = document.getElementById("calcular");
const limparBtn = document.getElementById("limpar");
const resultadoP = document.getElementById("resultado");
const chartCanvas = document.getElementById("normalDistributionChart");

let normalChart;

// 2. Manipuladores de Eventos (Event Handlers)

document.addEventListener("DOMContentLoaded", () => {
  desenharGrafico(0, 1);

  calcularBtn.addEventListener("click", executarCalculo);
  tipoPerguntaSelect.addEventListener("change", gerenciarVisibilidadeValor2);
  limparBtn.addEventListener("click", limparFormulario);
});

function gerenciarVisibilidadeValor2() {
  if (tipoPerguntaSelect.value === "entre") {
    valor2Container.classList.remove("hidden");
  } else {
    valor2Container.classList.add("hidden");
  }
}

function limparFormulario() {
  resultadoP.innerHTML = '<i class="fas fa-lightbulb"></i> Preencha os parâmetros e clique em "Calcular" para descobrir a probabilidade!';
  valor2Container.classList.add("hidden");
  desenharGrafico(0, 1);
}

// 3. Lógica Principal de Cálculo

function executarCalculo() {
  const media = parseFloat(mediaInput.value);
  const desvio = parseFloat(desvioInput.value);
  const valor1 = parseFloat(valor1Input.value);
  const tipo = tipoPerguntaSelect.value;

  if (isNaN(media) || isNaN(desvio) || isNaN(valor1)) {
    resultadoP.innerHTML = '<i class="fas fa-exclamation-triangle text-warning"></i> Ops! Por favor, preencha todos os campos numéricos.';
    return;
  }
  if (desvio <= 0) {
    resultadoP.innerHTML = '<i class="fas fa-times-circle text-danger"></i> Atenção! O Desvio Padrão deve ser maior que zero.';
    return;
  }

  let probabilidade = 0;
  let valor2 = NaN;

  if (tipo === "entre") {
    valor2 = parseFloat(valor2Input.value);
    if (isNaN(valor2)) {
      resultadoP.innerHTML = '<i class="fas fa-exclamation-triangle text-warning"></i> Por favor, preencha o segundo valor (x₂).';
      return;
    }
    probabilidade = calcularEntre(media, desvio, valor1, valor2);
  } else if (tipo === "menorQue") {
    probabilidade = calcularMenor(media, desvio, valor1);
  } else if (tipo === "maiorQue") {
    probabilidade = calcularMaior(media, desvio, valor1);
  }

  apresentarResultado(probabilidade, { media, desvio, valor1, valor2, tipo });
  desenharGrafico(media, desvio, tipo, valor1, valor2, probabilidade);
}

function apresentarResultado(probabilidade, dados) {
  let textoPergunta = "";
  const { valor1, valor2, tipo } = dados;

  switch (tipo) {
    case "menorQue":
      textoPergunta = `P(X < ${valor1})`;
      break;
    case "maiorQue":
      textoPergunta = `P(X > ${valor1})`;
      break;
    case "entre":
      const vMin = Math.min(valor1, valor2);
      const vMax = Math.max(valor1, valor2);
      textoPergunta = `P(${vMin} < X < ${vMax})`;
      break;
  }

  const porcentagem = (probabilidade * 100).toFixed(2);

  resultadoP.innerHTML = `
    <i class="fas fa-star text-warning"></i> 
    <strong>Resultado:</strong> A probabilidade ${textoPergunta} é de 
    <span style="color: var(--primary-color); font-weight: 800; font-size: 1.3em;">
      ${probabilidade.toFixed(4)}
    </span> 
    (${porcentagem}%)
  `;
}

// 4. Funções de Cálculo Estatístico

function calcularMenor(media, desvio, valor) {
  const z = (valor - media) / desvio;
  return cdf(z);
}

function calcularMaior(media, desvio, valor) {
  return 1 - calcularMenor(media, desvio, valor);
}

function calcularEntre(media, desvio, valor1, valor2) {
  const vMin = Math.min(valor1, valor2);
  const vMax = Math.max(valor1, valor2);
  return (
    calcularMenor(media, desvio, vMax) - calcularMenor(media, desvio, vMin)
  );
}

function cdf(z) {
  return 0.5 * (1 + erf(z / Math.sqrt(2)));
}

function erf(x) {
  const a1 = 0.254829592,
    a2 = -0.284496736,
    a3 = 1.421413741;
  const a4 = -1.453152027,
    a5 = 1.061405429,
    p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x);

  const t = 1.0 / (1.0 + p * absX);
  const y =
    1.0 -
    ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);

  return sign * y;
}

function pdf(x, media, desvio) {
  const exponent = -0.5 * Math.pow((x - media) / desvio, 2);
  const coefficient = 1 / (desvio * Math.sqrt(2 * Math.PI));
  return coefficient * Math.exp(exponent);
}

// 5. Funções de Geração e Desenho do Gráfico

function gerarPontosCurva(media, desvio) {
  const pontos = [];

  const minX = media - 4 * desvio;
  const maxX = media + 4 * desvio;
  const step = (maxX - minX) / 200;

  for (let x = minX; x <= maxX; x += step) {
    pontos.push({ x, y: pdf(x, media, desvio) });
  }
  return pontos;
}

function gerarAreaSombreada(pontosCurva, dados) {
  const { media, desvio, valor1, valor2, tipo } = dados;
  if (!tipo || valor1 === null) return [];

  let lim_inf, lim_sup;
  switch (tipo) {
    case "menorQue":
      lim_inf = pontosCurva[0].x;
      lim_sup = valor1;
      break;
    case "maiorQue":
      lim_inf = valor1;
      lim_sup = pontosCurva[pontosCurva.length - 1].x;
      break;
    case "entre":
      lim_inf = Math.min(valor1, valor2);
      lim_sup = Math.max(valor1, valor2);
      break;
    default:
      return [];
  }

  const areaSombreada = pontosCurva.filter(
    (p) => p.x >= lim_inf && p.x <= lim_sup
  );

  if (areaSombreada.length > 0) {
    areaSombreada.unshift({ x: areaSombreada[0].x, y: 0 });
    areaSombreada.push({ x: areaSombreada[areaSombreada.length - 1].x, y: 0 });
  }

  return areaSombreada;
}

function desenharGrafico(
  media,
  desvio,
  tipo = null,
  valor1 = null,
  valor2 = null,
  probabilidade = null
) {
  const ctx = chartCanvas.getContext("2d");

  if (normalChart) {
    normalChart.destroy();
  }

  const pontosCurva = gerarPontosCurva(media, desvio);
  const datasets = [
    {
      label: `Distribuição Normal (μ=${media}, σ=${desvio})`,
      data: pontosCurva,
      borderColor: "#4f46e5",
      backgroundColor: "rgba(79, 70, 229, 0.1)",
      borderWidth: 3,
      fill: false,
      pointRadius: 0,
      tension: 0.4,
    },
  ];

  const areaSombreada = gerarAreaSombreada(pontosCurva, {
    media,
    desvio,
    valor1,
    valor2,
    tipo,
  });

  if (areaSombreada.length > 0) {
    datasets.push({
      label: `Probabilidade = ${probabilidade.toFixed(4)}`,
      data: areaSombreada,
      backgroundColor: "rgba(88, 204, 2, 0.6)",
      borderColor: "rgba(88, 204, 2, 1)",
      borderWidth: 2,
      fill: true,
      pointRadius: 0,
    });
  }

  normalChart = new Chart(ctx, {
    type: "line",
    data: { datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top",
          labels: {
            usePointStyle: true,
            padding: 20,
            font: {
              family: 'Nunito',
              size: 12,
              weight: '600'
            }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(45, 55, 72, 0.9)',
          titleColor: 'white',
          bodyColor: 'white',
          cornerRadius: 8,
          displayColors: false,
          callbacks: {
            label: (context) => `Densidade: ${context.parsed.y.toFixed(4)}`,
          },
        },
      },
      scales: {
        x: {
          type: "linear",
          title: {
            display: true,
            text: "Valores (X)",
            font: {
              family: 'Nunito',
              size: 14,
              weight: '700'
            },
            color: '#2d3748'
          },
          grid: {
            color: 'rgba(45, 55, 72, 0.1)'
          },
          ticks: {
            font: {
              family: 'Nunito',
              size: 11,
              weight: '600'
            },
            color: '#4a5568'
          }
        },
        y: {
          type: "linear",
          beginAtZero: true,
          title: {
            display: true,
            text: "Densidade de Probabilidade",
            font: {
              family: 'Nunito',
              size: 14,
              weight: '700'
            },
            color: '#2d3748'
          },
          grid: {
            color: 'rgba(45, 55, 72, 0.1)'
          },
          ticks: {
            font: {
              family: 'Nunito',
              size: 11,
              weight: '600'
            },
            color: '#4a5568'
          }
        },
      },
    },
  });
}