
# Spacecom | Encounter Detection System

Sistema de detecção de encontros por geolocalização, desenvolvido como parte do desafio técnico do Programa Trainee Tech Spacecom 2027.

O projeto tem como objetivo processar registros de posicionamento geográfico, identificar situações de proximidade entre indivíduos e classificar encontros conforme regras de negócio específicas.

## Tecnologias

- Node.js
- TypeScript
- Fórmula de Haversine
- Processamento de arquivos CSV/TXT
- JSON para saída de resultados

## Objetivo

Desenvolver uma solução capaz de identificar encontros entre indivíduos monitorados a partir de registros contendo coordenadas geográficas, timestamps e informações relacionadas a facções e medidas protetivas.

A aplicação deverá identificar três categorias de encontros:

| Tipo | Descrição |
| --- | --- |
| `generico` | Proximidade entre indivíduos monitorados |
| `faccao` | Proximidade entre monitorados pertencentes à mesma facção |
| `protetiva` | Proximidade entre uma vítima e um agressor vinculado à sua medida protetiva |

## Regras de negócio

A detecção deve respeitar os seguintes critérios:

- Considerar encontros com distância estritamente inferior a 20 metros.
- Calcular distâncias geográficas utilizando a fórmula de Haversine, com raio terrestre de 6.371.000 metros.
- Comparar exclusivamente registros com timestamps idênticos.
- Impedir registros duplicados para o mesmo par, tipo de encontro e timestamp.
- Gerar resultados em JSON, respeitando a estrutura exigida pelo desafio.

## Arquitetura proposta

A solução será organizada em módulos com responsabilidades específicas, buscando facilitar a manutenção, os testes e a evolução do algoritmo.

```text
backend/
├── src/
│   ├── index.ts
│   ├── types.ts
│   ├── parse.ts
│   ├── geo.ts
│   └── detect.ts
├── tests/
├── datasets/
├── outputs/
├── package.json
└── tsconfig.json
```

### Responsabilidades

- `index.ts`: ponto de entrada e execução do processamento.
- `types.ts`: definição dos tipos e contratos dos dados.
- `parse.ts`: leitura, interpretação e validação dos registros.
- `geo.ts`: cálculos geográficos e distância por Haversine.
- `detect.ts`: identificação, classificação e deduplicação dos encontros.

## Estratégia de implementação

O processamento será dividido em etapas:

1. Ler e validar os registros de entrada.
2. Agrupar os posicionamentos por timestamp.
3. Identificar candidatos a encontros por proximidade geográfica.
4. Calcular as distâncias por Haversine.
5. Aplicar as regras de classificação.
6. Eliminar encontros duplicados.
7. Gerar os arquivos JSON de resultado.

### Desempenho

A abordagem proposta considera o uso de indexação espacial para reduzir comparações desnecessárias entre posicionamentos distantes.

A prioridade é preservar a correção dos resultados e, posteriormente, avaliar oportunidades de otimização com base em medições reais.

## Validação e qualidade

O projeto prevê:

- Testes unitários para os cálculos geográficos.
- Validação das regras de classificação.
- Testes para timestamps e encontros duplicados.
- Comparação com os resultados de referência fornecidos no desafio.
- Avaliação do tempo de execução em diferentes datasets.

## Status

Em desenvolvimento.

A arquitetura, a implementação e os resultados serão documentados conforme a evolução do projeto.

## Contexto

Projeto desenvolvido para o processo seletivo do Programa Trainee Tech Spacecom 2027, com foco em resolução de problemas, eficiência algorítmica e boas práticas de Engenharia de Software.
