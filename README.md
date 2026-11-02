
# Spacecom | Encounter Detection System

Sistema de detecção de encontros por geolocalização, desenvolvido em **TypeScript e Node.js** como parte do desafio técnico do **Programa Trainee Tech Spacecom 2027**.

A solução tem como objetivo processar registros de posicionamento geográfico, identificar situações de proximidade entre indivíduos e classificar encontros conforme regras de negócio relacionadas a monitoramento, facções e medidas protetivas.

O projeto prioriza **correção dos resultados, eficiência algorítmica, tipagem estática e separação de responsabilidades**.

## Tecnologias

- TypeScript
- Node.js
- Haversine para cálculo de distâncias geográficas
- Indexação espacial tridimensional
- Processamento de dados em formato CSV/TXT
- JSON para representação dos resultados
- ESLint para análise estática de código

## Objetivo

Identificar encontros físicos entre indivíduos monitorados utilizando registros com coordenadas geográficas, timestamps e informações sobre facções e medidas protetivas.

A solução contempla três categorias:

| Tipo | Descrição |
| --- | --- |
| `generico` | Proximidade entre monitorados sem vínculo específico |
| `faccao` | Proximidade entre monitorados pertencentes à mesma facção |
| `protetiva` | Proximidade entre uma vítima e um agressor vinculado à sua medida protetiva |

## Regras de negócio

A detecção considera os seguintes critérios:

- Distância estritamente inferior a 20 metros.
- Cálculo geográfico por Haversine, utilizando raio terrestre de 6.371.000 metros.
- Comparação exclusiva entre posicionamentos com timestamps idênticos.
- Classificação dos encontros conforme os vínculos entre os indivíduos.
- Deduplicação de encontros por par de indivíduos e timestamp.
- Saída estruturada conforme o contrato JSON exigido pelo desafio.

## Arquitetura

A aplicação utiliza uma estrutura modular, separando modelos de dados, interpretação de registros, operações geográficas e regras de detecção.

```text
spacecom-encounter-detection/
├── backend/
│   ├── datasets/
│   ├── outputs/
│   ├── src/
│   │   ├── features/
│   │   │   └── encounters/
│   │   │       └── detect.ts
│   │   ├── types/
│   │   │   ├── encounter.ts
│   │   │   └── position.ts
│   │   ├── utils/
│   │   │   └── parser.ts
│   │   ├── app.ts
│   │   └── geolocation.ts
│   ├── tests/
│   ├── eslint.config.ts
│   ├── package.json
│   ├── package-lock.json
│   └── tsconfig.json
└── README.md
```

### Responsabilidades dos módulos

| Módulo | Responsabilidade |
| --- | --- |
| `types/position.ts` | Define o contrato dos registros de geolocalização |
| `types/encounter.ts` | Define a estrutura dos encontros e seus tipos |
| `utils/parser.ts` | Interpreta e valida registros dos datasets |
| `geolocation.ts` | Implementa Haversine e verifica o limite de proximidade |
| `features/encounters/detect.ts` | Identifica, classifica e deduplica encontros |
| `app.ts` | Ponto de integração do processamento, em desenvolvimento |

## Estratégia de detecção

O algoritmo foi estruturado para identificar encontros com precisão e evitar comparações geográficas desnecessárias.

### 1. Interpretação dos registros

O parser converte os registros delimitados por ponto e vírgula em objetos TypeScript tipados.

Entre as validações implementadas estão:

- Quantidade esperada de campos.
- Coordenadas geográficas válidas.
- Identificadores numéricos.
- Formato dos timestamps.
- Valores booleanos de medida protetiva.
- Listas de IDs de restrição.

### 2. Cálculo geográfico

O cálculo de distância utiliza a fórmula de Haversine, com raio terrestre de 6.371.000 metros.

Um encontro somente é considerado quando a distância calculada é **menor que 20 metros**.

### 3. Indexação espacial

Para reduzir comparações desnecessárias, o detector utiliza coordenadas cartesianas tridimensionais e organiza as posições em células espaciais de 20 metros.

Ao processar uma posição, o algoritmo consulta a célula atual e as células vizinhas para localizar possíveis encontros.

Os candidatos encontrados passam pela verificação de distância com Haversine.

Essa estratégia busca melhorar a eficiência em cenários com grande volume de registros geograficamente distribuídos.

### 4. Classificação dos encontros

Após identificar a proximidade, o detector avalia as características dos envolvidos.

A classificação implementada prioriza:

1. Encontros relacionados a medidas protetivas.
2. Encontros entre integrantes da mesma facção.
3. Encontros genéricos entre monitorados.

A classificação ainda será confrontada com os gabaritos oficiais para confirmar sua aderência aos resultados esperados.

### 5. Deduplicação

O algoritmo utiliza identificadores ordenados para reconhecer pares independentemente da ordem dos indivíduos.

Dessa forma, evita registrar mais de uma vez o mesmo par no mesmo timestamp.

## Formato de saída

O contrato de saída segue a estrutura exigida pela Spacecom:

```json
[
  {
    "tipo": "faccao",
    "monitoradosEncontro": [40, 44],
    "timestamp": "2024-01-01 00:01:50",
    "posicoes": {
      "40": {
        "lat": -10.07996,
        "lon": -37.08384
      },
      "44": {
        "lat": -10.07987,
        "lon": -37.08389
      }
    },
    "distanciaMetros": 11.406788673336607
  }
]
```

## Qualidade e validação

O projeto está configurado com TypeScript em modo estrito e ESLint.

A validação planejada inclui:

- Testes unitários para o cálculo de Haversine.
- Testes das regras de classificação.
- Verificação de timestamps idênticos.
- Verificação de encontros duplicados.
- Comparação dos resultados com os dois JSONs oficiais de referência.
- Medição do desempenho nos datasets disponibilizados.

A ausência de erros de compilação não substitui a validação funcional. Os resultados serão documentados após a execução dos testes.

## Como executar

### Pré-requisitos

- Node.js compatível com a versão do TypeScript utilizada.
- npm.

### Instalação

```bash
cd backend
npm install
```

### Verificação dos tipos

```bash
npx tsc --noEmit
```

A execução completa dos datasets será documentada após a integração do detector com a leitura dos arquivos e a geração dos JSONs.

## Status do desenvolvimento

| Componente | Status |
| --- | --- |
| Configuração TypeScript e ESLint | Configurado |
| Tipagem dos registros e encontros | Implementado |
| Parser dos datasets | Implementado |
| Fórmula de Haversine | Implementado |
| Detecção e classificação | Implementação inicial |
| Indexação espacial | Implementação inicial |
| Processamento completo dos arquivos | Pendente |
| Geração dos JSONs finais | Pendente |
| Testes automatizados | Pendente |
| Validação com gabaritos oficiais | Pendente |

## Decisões técnicas

A arquitetura foi definida considerando três prioridades:

**Correção:** aplicar explicitamente as regras de proximidade, timestamps e vínculos entre indivíduos.

**Eficiência:** utilizar indexação espacial para reduzir o número de comparações e reservar o cálculo de Haversine aos candidatos próximos.

**Manutenibilidade:** manter responsabilidades separadas e contratos tipados, facilitando testes, depuração e evolução.

A proposta evita dependências e camadas arquiteturais desnecessárias para um problema essencialmente algorítmico.

## Contexto

Desenvolvido para o processo seletivo do **Programa Trainee Tech Spacecom 2027**, com foco em resolução de problemas, qualidade de software e eficiência computacional.

Os dados utilizados no desafio são fictícios.
