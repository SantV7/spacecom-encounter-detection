Spacecom | Encounter Detection System
Sistema de detecção de encontros por geolocalização desenvolvido com Node.js e TypeScript para o desafio técnico do Programa Trainee Tech Spacecom 2027.

A aplicação processa registros de monitoramento eletrônico, identifica situações de proximidade entre indivíduos e classifica os encontros de acordo com regras relacionadas a facções e medidas protetivas.

A solução foi estruturada com foco em correção dos resultados, eficiência algorítmica, organização do código e validação reproduzível.
1. Objetivo
O objetivo do projeto é identificar encontros entre pessoas monitoradas a partir de registros de posicionamento geográfico.

Para que um encontro seja considerado válido, dois indivíduos devem possuir registros no mesmo instante e estar separados por uma distância inferior a 20 metros.

Após identificar a proximidade, o sistema analisa as informações associadas aos monitorados para determinar a classificação do encontro.

A aplicação recebe arquivos de texto contendo registros separados por ponto e vírgula e produz arquivos JSON com os encontros detectados.
2. Tecnologias utilizadas
- Node.js — ambiente de execução JavaScript.
- TypeScript — tipagem estática e organização dos contratos de dados.
- TSX — execução de arquivos TypeScript durante o desenvolvimento.
- ESLint — padronização e análise estática do código.
- Git e GitHub — versionamento e disponibilização do projeto.
A solução utiliza recursos nativos do Node.js para leitura de arquivos, processamento de dados e geração dos resultados, sem depender de frameworks web.
3. Estrutura do projeto
spacecom-encounter-detection/
├── backend/
│   ├── datasets/
│   │   ├── examples/
│   │   │   ├── dataset1.txt
│   │   │   ├── dataset2.txt
│   │   │   ├── dataset3.txt
│   │   │   ├── dataset4.txt
│   │   │   ├── dataset5.txt
│   │   │   ├── dataset6.txt
│   │   │   └── dataset7.txt
│   │   └── expected/
│   │       ├── first_answers.json
│   │       └── second_answers.json
│   ├── outputs/
│   │   ├── output1.json
│   │   ├── output2.json
│   │   ├── output3.json
│   │   ├── output4.json
│   │   ├── output5.json
│   │   ├── output6.json
│   │   └── output7.json
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
│   ├── .gitignore
│   ├── eslint.config.ts
│   ├── package.json
│   ├── package-lock.json
│   └── tsconfig.json
└── README.md
Responsabilidades dos módulos
src/app.ts é responsável pela execução da aplicação, leitura dos datasets, integração entre os módulos e geração dos arquivos de saída.

src/utils/parser.ts realiza a interpretação dos registros de entrada, convertendo os campos textuais em estruturas tipadas para processamento.

src/geolocation.ts concentra as operações geográficas utilizadas na identificação de proximidade, incluindo o cálculo de distância pela fórmula de Haversine.

src/features/encounters/detect.ts implementa a lógica de detecção e classificação dos encontros, incluindo a utilização de indexação espacial para reduzir comparações desnecessárias.

src/types/position.ts e src/types/encounter.ts definem os contratos de dados utilizados na aplicação.

src/validate.ts realiza a comparação dos resultados gerados com os gabaritos oficiais disponibilizados para os dois primeiros datasets.

A separação entre leitura, processamento geográfico, regras de negócio e validação facilita a manutenção e a evolução da solução.
4. Formato dos dados de entrada
Os datasets contêm registros separados por ponto e vírgula, seguindo a estrutura:
idMonitorado;faccaoMonitorado;timestamp;latitude;longitude;medidaProtetiva;idsRestricaoMedida
Cada registro contém:

| Campo | Descrição |

|---|---|

| idMonitorado | Identificador único do monitorado |

| faccaoMonitorado | Facção associada ao indivíduo, quando existente |

| timestamp | Data e horário do posicionamento |

| latitude | Coordenada geográfica de latitude |

| longitude | Coordenada geográfica de longitude |

| medidaProtetiva | Indicação de medida protetiva |

| idsRestricaoMedida | Identificadores relacionados às restrições da medida protetiva |

O parser converte os valores recebidos em tipos adequados, permitindo que a detecção trabalhe com registros estruturados.
5. Regras de detecção
Um encontro é identificado quando duas pessoas apresentam registros com o mesmo timestamp e distância geográfica inferior a 20 metros.

A aplicação classifica os encontros em três categorias.
Encontro genérico
Representa uma situação de proximidade entre dois monitorados que não se enquadra nas classificações específicas de facção ou medida protetiva.
Encontro de facção
Representa uma situação de proximidade entre monitorados associados à mesma facção.

A classificação considera as informações de facção presentes nos registros.
Encontro de medida protetiva
Representa uma situação de proximidade envolvendo uma pessoa com medida protetiva e um monitorado identificado nas restrições associadas a essa medida.

A análise utiliza os identificadores informados no campo idsRestricaoMedida, evitando classificar qualquer proximidade com uma pessoa protegida como violação.
Critérios gerais
A detecção considera:
- Coincidência exata de timestamp.
- Distância estritamente inferior a 20 metros.
- Identificação dos dois monitorados envolvidos.
- Aplicação das regras de classificação.
- Prevenção de registros duplicados para o mesmo par no mesmo instante.
A comparação espacial utiliza coordenadas geográficas e não depende de serviços externos de mapas.
6. Cálculo de distância com Haversine
A distância entre dois monitorados é calculada utilizando a fórmula de Haversine, que estima a distância sobre a superfície terrestre a partir de coordenadas de latitude e longitude.

A implementação considera o raio médio da Terra de 6.371.000 metros.

A fórmula é representada por:
Δφ = φ₂ - φ₁
Δλ = λ₂ - λ₁

a = sen²(Δφ / 2)

  + cos(φ₁) × cos(φ₂) × sen²(Δλ / 2)
c = 2 × atan2(√a, √(1 - a))

d = R × c
Onde:
- φ representa a latitude em radianos.
- λ representa a longitude em radianos.
- R representa o raio médio da Terra.
- d representa a distância calculada em metros.
O encontro é considerado válido somente quando:
distanciaMetros < 20
Essa condição respeita o limite estrito estabelecido no desafio.
7. Estratégia de processamento e desempenho
A solução foi desenvolvida considerando o aumento progressivo do volume de registros entre os datasets.

Uma abordagem ingênua compararia todos os monitorados entre si, produzindo um número elevado de operações e comprometendo o desempenho em arquivos maiores.

Para reduzir esse custo, o processamento combina agrupamento temporal e indexação espacial.
7.1. Agrupamento por timestamp
Os registros são organizados de acordo com o instante de posicionamento.

Como um encontro exige timestamps iguais, não é necessário comparar registros pertencentes a instantes diferentes.

Essa estratégia reduz o conjunto de candidatos analisados em cada etapa.
7.2. Indexação espacial
A detecção utiliza uma estrutura de indexação espacial baseada em células para localizar possíveis encontros.

As posições são associadas a células espaciais, permitindo restringir as comparações a regiões próximas.

A busca considera células vizinhas para evitar que dois monitorados próximos sejam ignorados apenas por estarem em lados diferentes de uma divisão espacial.

Após selecionar os candidatos, a aplicação utiliza Haversine para verificar a distância efetiva.

Assim, a indexação funciona como uma etapa de filtragem, enquanto a fórmula geográfica determina se o encontro satisfaz o limite exigido.
7.3. Leitura progressiva
A aplicação utiliza leitura progressiva dos arquivos, evitando carregar todo o dataset em memória de uma única vez.

O processamento trabalha com grupos temporais consecutivos, reduzindo a necessidade de manter registros de outros instantes durante a detecção.

Essa abordagem pressupõe que os registros de entrada estejam ordenados por timestamp, conforme a estratégia adotada pela implementação.
7.4. Geração dos resultados
Os encontros identificados são serializados em JSON e gravados nos arquivos correspondentes.

A separação entre leitura, detecção e escrita permite processar os datasets sem exigir que todos os resultados permaneçam simultaneamente em memória.
7.5. Complexidade
Uma comparação direta entre todos os registros de um grupo temporal apresenta complexidade quadrática em relação ao número de posições desse grupo.

Com a indexação espacial, a busca é direcionada aos candidatos localizados em regiões próximas.

O desempenho efetivo depende da distribuição espacial dos registros e da quantidade de candidatos encontrados. Em situações de alta concentração de monitorados na mesma região, o número de comparações pode aumentar.

Portanto, a indexação reduz comparações desnecessárias, mas não elimina o pior caso quadrático.
8. Formato dos resultados
Cada dataset produz um arquivo JSON contendo um array de encontros.

Os objetos seguem a estrutura:
[
  {
    "tipo": "generico",
    "monitoradosEncontro": [4, 6],
    "timestamp": "2024-01-01 00:05:15",
    "posicoes": {
      "4": {
        "lat": -31.93195,
        "lon": -40.61438
      },
      "6": {
        "lat": -31.93187,
        "lon": -40.61435
      }
    },
    "distanciaMetros": 9.33522817789823
  }
]
Os campos representam:

| Campo | Descrição |

|---|---|

| tipo | Classificação do encontro |

| monitoradosEncontro | Identificadores dos dois monitorados |

| timestamp | Instante em que o encontro ocorreu |

| posicoes | Latitude e longitude de cada monitorado |

| distanciaMetros | Distância calculada entre os indivíduos |

Os arquivos são armazenados em backend/outputs/, seguindo a nomenclatura output1.json até output7.json.
9. Instalação e execução
Pré-requisitos
É necessário possuir Node.js e npm instalados.
Clonar o repositório
git clone https://github.com/SantV7/spacecom-encounter-detection.git
cd spacecom-encounter-detection/backend
Instalar as dependências
npm install
Executar a aplicação
A aplicação pode ser executada utilizando o script de desenvolvimento configurado no projeto:
npm run dev
Os datasets devem estar disponíveis em backend/datasets/examples/.

Os resultados são gerados no diretório backend/outputs/.
Validar os resultados
npm run validate
Esse comando compara os arquivos gerados para os dois primeiros datasets com os respectivos gabaritos oficiais.
10. Validação com os gabaritos oficiais
O desafio disponibiliza respostas de referência para os datasets 1 e 2.

Esses arquivos foram utilizados para verificar a implementação antes da geração dos resultados dos demais cenários.

A validação compara os encontros esperados com os encontros produzidos, verificando os identificadores dos monitorados, timestamps, classificações, posições e distâncias.
Dataset 1
Dataset 1: PASSOU
Esperados: 4
Gerados: 4
Corretos: 4
Ausentes: 0
Incorretos: 0
Dataset 2
Dataset 2: PASSOU
Esperados: 6
Gerados: 6
Corretos: 6
Ausentes: 0
Incorretos: 0
Os dois datasets de referência foram validados com sucesso, sem encontros ausentes ou incorretos.

Essa validação confirma a correspondência da implementação com os exemplos oficiais fornecidos, mas não representa uma confirmação dos resultados dos cinco datasets sem gabarito público.
11. Resultados dos sete datasets
A aplicação foi executada sobre os sete datasets disponibilizados para o desafio.

Todos os arquivos JSON foram gerados e passaram por uma verificação estrutural, incluindo formato de array, classificação válida, presença dos campos obrigatórios e distâncias inferiores a 20 metros.

| Dataset | Encontros detectados | Verificação estrutural |

|---|---:|---|

| Dataset 1 | 4 | Aprovada |

| Dataset 2 | 6 | Aprovada |

| Dataset 3 | 10 | Aprovada |

| Dataset 4 | 15 | Aprovada |

| Dataset 5 | 21 | Aprovada |

| Dataset 6 | 27 | Aprovada |

| Dataset 7 | 35 | Aprovada |

| Total | 118 | 7 arquivos válidos |

Os resultados dos datasets 3 a 7 são produzidos pela mesma implementação validada nos exemplos oficiais.

Como os gabaritos desses cinco cenários não foram disponibilizados, a verificação realizada confirma a estrutura dos arquivos, mas não a correspondência integral dos encontros com respostas oficiais.
12. Decisões técnicas
TypeScript
A escolha do TypeScript permite representar explicitamente os registros de entrada e os encontros de saída, reduzindo ambiguidades na manipulação dos dados.
Node.js sem framework HTTP
O desafio exige processamento de arquivos e geração de resultados, não a disponibilização de uma API.

Por esse motivo, foi adotada uma aplicação de linha de comando, evitando a inclusão de um servidor HTTP desnecessário.
Haversine
A fórmula de Haversine foi escolhida por permitir calcular distâncias geográficas diretamente a partir das coordenadas fornecidas.
Indexação espacial
A indexação foi incorporada para reduzir o número de comparações entre monitorados, principalmente nos cenários com maior volume de registros.
Processamento progressivo
A leitura progressiva foi utilizada para evitar o carregamento integral dos arquivos e permitir o processamento de datasets maiores com consumo de memória mais controlado.
Validação automatizada
A comparação com os gabaritos oficiais foi implementada como uma etapa independente, permitindo verificar a correção dos resultados de referência de maneira reproduzível.
Separação de responsabilidades
Os módulos foram organizados para distinguir interpretação dos dados, cálculos geográficos, regras de detecção, execução e validação.

Essa organização facilita a compreensão da solução e a identificação de possíveis melhorias.
13. Limitações e considerações
A implementação foi desenvolvida especificamente para o formato de dados e as regras estabelecidas no desafio.

O processamento progressivo considera a organização temporal dos registros de entrada.

A indexação espacial melhora a seleção de candidatos, mas o custo de processamento depende da distribuição geográfica e temporal dos monitorados.

A validação oficial disponível cobre os dois primeiros datasets. Para os demais, foram realizadas a geração dos resultados e a verificação estrutural dos arquivos JSON.

Os dados disponibilizados para o desafio são fictícios.
14. Referências do desafio
Datasets disponibilizados pela Spacecom:
https://bucket-projeto-trainee.s3.sa-east-1.amazonaws.com/dataset1.txt
https://bucket-projeto-trainee.s3.sa-east-1.amazonaws.com/dataset2.txt
https://bucket-projeto-trainee.s3.sa-east-1.amazonaws.com/dataset3.txt
https://bucket-projeto-trainee.s3.sa-east-1.amazonaws.com/dataset4.txt
https://bucket-projeto-trainee.s3.sa-east-1.amazonaws.com/dataset5.txt
https://bucket-projeto-trainee.s3.sa-east-1.amazonaws.com/dataset6.txt
https://bucket-projeto-trainee.s3.sa-east-1.amazonaws.com/dataset7.txt
Gabaritos oficiais disponibilizados:
- Respostas do Dataset 1
- Respostas do Dataset 2
15. Autor
Desenvolvido por Vinícius Santos Oliveira para o desafio técnico do Programa Trainee Tech Spacecom 2027.
- GitHub: SantV7
- Repositório: spacecom-encounter-detection
Projeto desenvolvido com foco em Engenharia de Software, processamento eficiente de dados, detecção geográfica de proximidade e validação de resultados.