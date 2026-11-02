
# Spacecom | Encounter Detection System

Sistema de detecção de encontros por geolocalização, desenvolvido em **TypeScript e Node.js** como parte do desafio técnico do **Programa Trainee Tech Spacecom 2027**.

A aplicação processa registros de posicionamento geográfico, identifica situações de proximidade entre indivíduos e classifica encontros de acordo com regras relacionadas a monitoramento, facções e medidas protetivas.

A solução prioriza **correção dos resultados, eficiência algorítmica, tipagem estática, separação de responsabilidades e validação reproduzível**.

## Tecnologias

- **TypeScript** — tipagem estática e definição dos contratos de dados.
- **Node.js** — processamento dos arquivos e execução do algoritmo.
- **Haversine** — cálculo de distâncias geográficas.
- **Indexação espacial 3D** — redução de comparações desnecessárias.
- **Streams e Readline** — leitura progressiva dos datasets.
- **JSON** — representação dos encontros detectados.
- **ESLint** — análise estática e padronização do código.

## Objetivo

Identificar encontros físicos entre indivíduos a partir de registros contendo coordenadas geográficas, timestamps, facções e medidas protetivas.

São consideradas três categorias:

| Tipo | Descrição |
| --- | --- |
| `generico` | Proximidade entre monitorados sem vínculo específico |
| `faccao` | Proximidade entre monitorados da mesma facção |
| `protetiva` | Proximidade entre uma vítima e um agressor vinculado à sua medida protetiva |

## Regras de negócio

A detecção respeita os seguintes critérios:

- Distância estritamente inferior a **20 metros**.
- Cálculo geográfico utilizando a fórmula de **Haversine**, com raio terrestre de **6.371.000 metros**.
- Comparação exclusiva de posicionamentos com timestamps idênticos.
- Classificação conforme os vínculos entre os indivíduos.
- Deduplicação por par de indivíduos e timestamp, independentemente da ordem dos IDs.
- Geração de arquivos JSON no formato exigido pelo desafio.

## Estrutura do projeto

```text
spacecom-encounter-detection/
├── backend/
│   ├── datasets/
│   │   ├── examples/
│   │   │   ├── dataset1.txt
│   │   │   └── dataset2.txt
│   │   └── expected/
│   │       ├── first_answers.json
│   │       └── second_answers.json
│   ├── outputs/
│   │   ├── output1.json
│   │   └── output2.json
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
│   │   ├── geolocation.ts
│   │   └── validate.ts
│   ├── tests/
│   ├── eslint.config.ts
│   ├── package.json
│   ├── package-lock.json
│   └── tsconfig.json
└── README.md
```

Os arquivos dos datasets de referência e os respectivos gabaritos são utilizados para validar a solução. A disponibilidade desses arquivos no repositório depende da configuração de versionamento.

### Responsabilidades dos módulos

| Módulo | Responsabilidade |
| --- | --- |
| `types/position.ts` | Define a estrutura de um registro de geolocalização |
| `types/encounter.ts` | Define os tipos e o contrato JSON de um encontro |
| `utils/parser.ts` | Interpreta e valida os registros dos datasets |
| `geolocation.ts` | Calcula distâncias com Haversine |
| `features/encounters/detect.ts` | Localiza candidatos, classifica e deduplica encontros |
| `app.ts` | Integra leitura dos arquivos, processamento e geração de JSON |
| `validate.ts` | Compara os resultados gerados com os gabaritos oficiais |

## Estratégia de implementação

### 1. Leitura e validação dos registros

Os datasets utilizam campos separados por ponto e vírgula (`;`), contendo identificadores, facções, timestamps, coordenadas e informações sobre medidas protetivas.

O parser realiza a conversão para objetos TypeScript, validando:

- Quantidade de campos esperada.
- Identificadores e facções.
- Latitude e longitude.
- Formato do timestamp.
- Valores booleanos.
- Listas de identificadores vinculados a medidas protetivas.

### 2. Processamento por timestamp

A aplicação utiliza streams e a API `readline` do Node.js para percorrer os registros sem carregar o arquivo inteiro na memória.

As posições são agrupadas conforme o timestamp. Cada grupo é enviado separadamente ao detector.

A implementação atual pressupõe registros em ordem cronológica. Caso identifique um timestamp anterior ao grupo já processado, a aplicação interrompe a execução para evitar resultados incompletos.

### 3. Cálculo de distância

O módulo geográfico utiliza a fórmula de Haversine:

```text
a = sin²(Δφ/2) + cos(φ1) × cos(φ2) × sin²(Δλ/2)

d = 2 × R × asin(√a)
```

Onde:

- `φ` representa a latitude em radianos.
- `λ` representa a longitude em radianos.
- `R` corresponde ao raio terrestre de 6.371.000 metros.
- `d` representa a distância entre as posições, em metros.

Somente distâncias **menores que 20 metros** são consideradas encontros válidos.

### 4. Indexação espacial tridimensional

Para evitar comparações entre todos os indivíduos de cada timestamp, o algoritmo utiliza uma estrutura de indexação espacial.

As coordenadas geográficas são convertidas para coordenadas cartesianas tridimensionais e distribuídas em células de 20 metros.

Ao analisar um registro, o detector consulta a célula correspondente e suas 26 células vizinhas.

Essa abordagem reduz o número de pares candidatos em cenários com posições geograficamente dispersas.

A distância definitiva entre candidatos é sempre calculada por Haversine.

### 5. Classificação de encontros

O algoritmo aplica as regras de negócio para identificar:

1. **Encontro de medida protetiva:** proximidade entre vítima e agressor presente na lista de restrições.
2. **Encontro de facção:** proximidade entre monitorados com a mesma facção identificada.
3. **Encontro genérico:** proximidade entre dois monitorados sem vínculo específico.

Cada par recebe apenas uma classificação por timestamp, evitando registros redundantes.

### 6. Deduplicação

Os pares de indivíduos são identificados por seus IDs ordenados e pelo timestamp.

Dessa forma, encontros entre os IDs `4` e `6` são tratados como o mesmo par, independentemente da ordem em que os registros foram lidos.

### 7. Geração dos resultados

O processamento gera um arquivo JSON contendo os encontros identificados.

Cada objeto inclui:

- Tipo do encontro.
- IDs dos envolvidos.
- Timestamp.
- Coordenadas dos participantes.
- Distância calculada em metros.

## Formato de saída

Exemplo de encontro:

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

## Como executar

### Pré-requisitos

- Node.js
- npm

### Instalação

Na raiz do projeto:

```bash
cd backend
npm install
```

### Verificação dos tipos

```bash
npx tsc --noEmit
```

### Processamento do dataset 1

```bash
npm run dev -- datasets/examples/dataset1.txt outputs/output1.json
```

### Processamento do dataset 2

```bash
npm run dev -- datasets/examples/dataset2.txt outputs/output2.json
```

Também é possível processar outros arquivos informando o caminho de entrada e o caminho desejado para o JSON de saída:

```bash
npm run dev -- datasets/dataset3.txt outputs/output3.json
```

### Validação automatizada

Após gerar os resultados dos datasets 1 e 2:

```bash
npm run validate
```

O comando executa o módulo `src/validate.ts`, que compara os encontros gerados com os gabaritos de referência.

A verificação considera:

- Tipo de encontro.
- Identificadores dos envolvidos, independentemente da ordem.
- Timestamp.
- Latitude e longitude de cada indivíduo.
- Distância geográfica, com tolerância numérica de `1e-6`.
- Encontros ausentes, inesperados e duplicados.

A validação encerra com código de erro caso encontre divergências.

## Resultados obtidos

Os dois datasets de referência disponibilizados pela Spacecom foram processados e validados.

### Processamento

| Métrica | Dataset 1 | Dataset 2 |
| --- | ---: | ---: |
| Registros processados | 5.000 | 25.000 |
| Encontros detectados | 4 | 6 |
| Tempo observado | 0,066 s | 0,276 s |
| Arquivo gerado | `output1.json` | `output2.json` |

Os tempos representam execuções locais observadas durante o desenvolvimento. Não constituem benchmarks estatísticos ou garantias de desempenho em outros ambientes.

### Comparação com os gabaritos oficiais

| Métrica | Dataset 1 | Dataset 2 |
| --- | ---: | ---: |
| Encontros esperados | 4 | 6 |
| Encontros corretos | 4 | 6 |
| Encontros ausentes | 0 | 0 |
| Encontros incorretos | 0 | 0 |
| Resultado | PASSOU | PASSOU |

**Resultado:** os 10 encontros dos dois datasets de referência corresponderam aos gabaritos oficiais na validação automatizada.

A validação desses dois datasets demonstra a correção da solução nos casos de referência disponibilizados, mas não garante a ausência de diferenças nos demais datasets.

## Qualidade de código

O projeto utiliza:

- Tipagem estática com TypeScript.
- Contratos separados para entradas e saídas.
- Organização modular por responsabilidade.
- Tratamento de erros na leitura e validação dos registros.
- Verificação estática de tipos.
- Validação automatizada contra resultados conhecidos.
- Commits organizados por funcionalidade e correção.

Os testes unitários específicos para cálculos geográficos, limites de distância e casos extremos ainda estão previstos para a etapa de finalização.

## Decisões técnicas

A solução foi construída considerando três objetivos principais.

### Correção

Aplicação explícita das regras de distância, timestamp, classificação e unicidade, com validação por meio dos gabaritos oficiais.

### Eficiência

Uso de indexação espacial para reduzir comparações entre posições distantes e leitura progressiva para limitar o consumo de memória durante a interpretação dos datasets.

Na implementação atual, os encontros detectados são acumulados antes da escrita do JSON final. A escrita progressiva será avaliada para datasets maiores.

### Manutenibilidade

Separação dos módulos de parsing, geolocalização, detecção, execução e validação, permitindo modificar e testar cada responsabilidade de forma independente.

## Status do desenvolvimento

| Componente | Status |
| --- | --- |
| Configuração TypeScript e ESLint | Concluído |
| Tipagem dos registros e encontros | Concluído |
| Parser e validação dos registros | Concluído |
| Fórmula de Haversine | Concluído |
| Detecção e classificação | Implementado e validado nos exemplos |
| Indexação espacial | Implementado |
| Leitura progressiva dos datasets | Implementado |
| Geração de arquivos JSON | Implementado |
| Validação automatizada dos gabaritos | Concluído |
| Dataset 1 | Validado |
| Dataset 2 | Validado |
| Datasets 3 a 7 | Pendente |
| Testes unitários adicionais | Pendente |
| Otimização da escrita dos resultados | Pendente |
| Preparação da entrega final | Pendente |

## Contexto

Projeto desenvolvido para o processo seletivo do **Programa Trainee Tech Spacecom 2027**, com foco em resolução de problemas, boas práticas de Engenharia de Software, validação de resultados e eficiência algorítmica.

Os dados disponibilizados para o desafio são fictícios.
