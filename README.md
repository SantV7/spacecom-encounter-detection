Spacecom | Encounter Detection System
Sistema de detecção de encontros por geolocalização, desenvolvido em TypeScript e Node.js para o desafio técnico do Programa Trainee Tech Spacecom 2027.

A aplicação processa históricos de posicionamento, identifica pares de pessoas em proximidade física e classifica os encontros conforme regras de monitoramento eletrônico, facções e medidas protetivas. O projeto privilegia correção, desempenho, rastreabilidade e simplicidade de execução, sem depender de serviços externos de geolocalização.

1. Objetivo e regras de negócio
A partir de registros geográficos, identificar encontros entre dois indivíduos que estejam a uma distância estritamente menor que 20 metros e possuam o mesmo timestamp.
Tipo	Regra de classificação
generico	Proximidade entre dois monitorados sem vínculo de facção em comum
faccao	Proximidade entre dois monitorados com o mesmo identificador de facção preenchido
protetiva	Proximidade entre uma vítima com medida protetiva e um agressor presente na lista de restrições dessa vítima


A implementação não considera a proximidade de uma vítima com uma pessoa fora de sua lista de restrições como violação de medida protetiva. Também não gera encontros entre duas vítimas. Para um mesmo par de IDs e timestamp, somente um encontro é registrado, independentemente da ordem em que os registros aparecem.

As regras geométricas são:
- Comparação exclusivamente entre timestamps idênticos.
- Distância calculada pela fórmula de Haversine, com raio terrestre de 6.371.000 metros.
- Aceitação apenas quando distanciaMetros < 20 (20 metros exatos não são aceitos).
- Identificação, classificação e deduplicação de cada encontro válido.

2. Tecnologias e ferramentas
- Node.js: execução do programa, leitura de arquivos e geração de JSON.
- TypeScript: tipagem estática dos registros, encontros e módulos.
- TSX: execução direta de TypeScript durante o desenvolvimento e nos testes.
- Node.js Test Runner (node:test): testes unitários sem framework adicional.
- ESLint: análise estática do código.
- Git e GitHub: controle de versão e publicação da solução.
Não foi utilizado framework HTTP porque o problema exige processamento de arquivos, e não uma API web. A aplicação funciona pela linha de comando.

3. Arquitetura
spacecom-encounter-detection/
├── backend/
│   ├── datasets/
│   │   ├── examples/
│   │   │   ├── dataset1.txt
│   │   │   ├── dataset2.txt
│   │   │   └── dataset3.txt ... dataset7.txt (download local)
│   │   └── expected/
│   │       ├── first_answers.json
│   │       └── second_answers.json
│   ├── outputs/
│   │   ├── output1.json
│   │   ├── output2.json
│   │   └── output3.json ... output7.json
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
│   │   ├── encounter.test.ts
│   │   └── geolocation.test.ts
│   ├── .gitignore
│   ├── eslint.config.ts
│   ├── package.json
│   ├── package-lock.json
│   ├── tsconfig.json
│   └── tsconfig.test.json
└── README.md
Responsabilidades: parser.ts interpreta e valida os registros; geolocation.ts calcula distâncias com Haversine; detect.ts seleciona pares candidatos, classifica os encontros e remove duplicidades; app.ts coordena leitura e escrita; validate.ts compara os outputs 1 e 2 com os gabaritos públicos. Os arquivos em types/ definem os contratos TypeScript.

Os datasets 3 a 7 são muito grandes e foram excluídos do versionamento. Os arquivos correspondentes podem ser baixados pelos links oficiais apresentados na seção 10. Os sete arquivos de saída permanecem disponíveis em backend/outputs/.

4. Dados de entrada
Arquivos .txt em formato semelhante a CSV, com delimitador ; e cabeçalho:
idMonitorado;faccaoMonitorado;timestamp;latitude;longitude;medidaProtetiva;idsRestricaoMedida
Campo	Significado
idMonitorado	Identificador numérico do indivíduo
faccaoMonitorado	ID da facção, quando houver
timestamp	Horário da leitura, no formato YYYY-MM-DD HH:MM:SS
latitude, longitude	Coordenadas geográficas em graus
medidaProtetiva	Indicador booleano de pessoa protegida
idsRestricaoMedida	IDs dos agressores vinculados à medida, separados por vírgula


O parser valida a quantidade de campos, coordenadas, valores numéricos, formato de timestamp e indicador de medida protetiva. Os registros são transformados em objetos tipados antes de entrar no detector.

5. Algoritmo e decisões de desempenho
5.1. Leitura por grupos temporais
O app.ts utiliza leitura de arquivo com stream e readline. Em vez de carregar todo o arquivo em memória, mantém apenas as posições do timestamp em processamento. Quando o timestamp muda, processa o grupo anterior e inicia o próximo.

Essa estratégia pressupõe entradas ordenadas cronologicamente, como os datasets utilizados. Caso encontre um timestamp anterior ao do grupo corrente, o programa sinaliza erro para evitar resultados incompletos.
5.2. Indexação espacial tridimensional
Cada posição geográfica é convertida em coordenadas cartesianas tridimensionais (ECEF), usando o raio terrestre de 6.371.000 metros. As coordenadas são distribuídas em células de 20 metros, implementadas com Map.

Ao analisar uma posição, o detector pesquisa a própria célula e as 26 células adjacentes, evitando comparações entre monitorados geograficamente distantes. A indexação seleciona candidatos; a distância definitiva entre cada par continua sendo verificada por Haversine.

Esse filtro é importante porque o crescimento dos datasets torna custosa a comparação de todos os indivíduos com todos os demais. Em situações de grande concentração numa mesma região, o custo ainda pode se aproximar do caso quadrático: não se afirma complexidade linear garantida.
5.3. Classificação e deduplicação
Para candidatos com distância inferior a 20 metros e timestamps iguais, o algoritmo aplica as regras de medida protetiva, facção e encontro genérico. Pares são identificados por IDs ordenados e timestamp, impedindo duplicação quando aparecem em ordem inversa ou há registros repetidos.
5.4. Escrita dos resultados
Os encontros de cada grupo são agregados em um array e, ao concluir a leitura do dataset, serializados no arquivo JSON solicitado. A leitura é progressiva, mas o array final de encontros permanece em memória até a escrita. Essa decisão simplifica a implementação e funcionou nos sete datasets do desafio; uma escrita incremental seria uma evolução possível para cenários com volumes muito maiores de encontros.

6. Formato do JSON de saída
Para cada dataset, a aplicação gera um array de objetos com o contrato exigido:
[
  {
    "tipo": "generico",
    "monitoradosEncontro": [4, 6],
    "timestamp": "2024-01-01 00:05:15",
    "posicoes": {
      "4": { "lat": -31.93195, "lon": -40.61438 },
      "6": { "lat": -31.93187, "lon": -40.61435 }
    },
    "distanciaMetros": 9.33522817789823
  }
]
Os tipos aceitos são generico, faccao e protetiva. Os resultados são gravados em backend/outputs/outputN.json, em que N corresponde ao dataset.

7. Como executar
Pré-requisitos
- Node.js com suporte a módulos ES e node:test (recomenda-se Node.js 22 ou superior).
- npm.
Instalação
No terminal, a partir da raiz do repositório:
cd backend
npm ci
Processar um dataset
O comando recebe o caminho do input e o caminho do JSON de saída:
npm run dev -- datasets/examples/dataset1.txt outputs/output1.json
Para outro dataset, altere o número nos dois caminhos. O script de desenvolvimento usa tsx watch; após concluir uma execução, é possível encerrar o processo com Ctrl + C.
Verificar tipos e compilar
npx tsc --noEmit
npm run build
Executar os testes automatizados
npx tsc -p tsconfig.test.json --noEmit
node --import tsx --test tests/*.test.ts
Validar com os gabaritos oficiais
npm run validate
Esse comando compara outputs/output1.json e outputs/output2.json com os respectivos arquivos em datasets/expected/. A execução deve ser feita a partir da pasta backend.

8. Testes e validação
Foram implementados 15 testes unitários, executados com node:test e node:assert/strict, sem dependência de Jest:
- 5 testes de geolocalização: distância zero, simetria do cálculo, distância positiva e identificação de pontos abaixo/acima de 20 metros.
- 10 testes de detecção: encontro genérico, facção igual, facções diferentes, medida protetiva vinculada, medida protetiva sem vínculo, timestamps distintos, distância fora do limite, deduplicação, grupos sem posições suficientes e preservação dos dados no output.
Na última execução local informada, o resultado foi de 15 testes aprovados e 0 falhas. A verificação de tipos dos testes também foi executada pelo compilador TypeScript.
Comparação com os gabaritos oficiais
Dataset	Esperados	Gerados	Corretos	Ausentes	Incorretos	Resultado
1	4	4	4	0	0	PASSOU
2	6	6	6	0	0	PASSOU


A comparação realizada por validate.ts verifica IDs, timestamp, classificação, posições e distância calculada com tolerância numérica de 1e-6 metro. Os dois gabaritos disponíveis foram reproduzidos sem encontros ausentes ou incorretos.
Outputs gerados
Dataset	Encontros identificados	Verificação
1	4	Gabarito oficial + estrutura
2	6	Gabarito oficial + estrutura
3	10	Estrutura JSON
4	15	Estrutura JSON
5	21	Estrutura JSON
6	27	Estrutura JSON
7	35	Estrutura JSON
Total	118	7 outputs gerados


Os outputs 3 a 7 foram gerados e submetidos a verificações estruturais. Não existem gabaritos públicos para esses cinco datasets, portanto não é possível declarar sua precisão final confirmada. Todos foram produzidos pelo mesmo algoritmo validado nos dois exemplos oficiais.
9. Limitações e possíveis evoluções
- A leitura por grupos pressupõe registros ordenados por timestamp.
- A indexação espacial reduz comparações em cenários dispersos, mas seu pior caso depende da densidade de posições próximas.
- A aplicação mantém os encontros detectados em memória até serializar o JSON de cada dataset.
- Os testes unitários cobrem regras centrais e cenários representativos, sem pretensão de esgotar todas as combinações de dados.
- Os datasets 3 a 7 não possuem gabaritos oficiais disponíveis para comparação.
O escopo foi mantido deliberadamente enxuto: não há framework web, banco de dados ou infraestrutura de containers porque não são necessários para resolver o problema proposto.

10. Datasets e referências oficiais
Os arquivos de entrada podem ser obtidos diretamente do armazenamento disponibilizado para o desafio:
- Dataset 1
- Dataset 2
- Dataset 3
- Dataset 4
- Dataset 5
- Dataset 6
- Dataset 7
Gabaritos de referência:
- Respostas do dataset 1
- Respostas do dataset 2

11. Autor e contexto
Desenvolvido por Vinícius Santos Oliveira para o desafio técnico do Programa Trainee Tech Spacecom 2027.
- GitHub: SantV7
- Repositório: spacecom-encounter-detection
Os dados utilizados no desafio são fictícios.