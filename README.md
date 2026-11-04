# Spacecom — Detecção de Encontros

Aplicação de linha de comando em TypeScript e Node.js para detectar encontros entre pessoas monitoradas a partir de arquivos de posicionamento separados por ponto e vírgula. O projeto atende ao desafio técnico do Programa Trainee Tech Spacecom 2027.

## Regras do desafio

Um encontro ocorre quando duas posições têm o mesmo timestamp e a distância calculada pela fórmula de Haversine é **estritamente menor que 20 metros**, usando raio terrestre de **6.371.000 metros**. A ordem dos IDs no resultado não altera a identidade do par; cada par é registrado uma vez por timestamp.

| Tipo | Regra |
| --- | --- |
| `generico` | Proximidade entre dois monitorados elegíveis sem facção em comum. |
| `faccao` | Proximidade entre dois monitorados com o mesmo identificador de facção não vazio. |
| `protetiva` | Proximidade entre uma vítima com medida protetiva e um agressor listado nas restrições dessa vítima. |

A aplicação não registra encontros entre duas vítimas nem classifica como violação a proximidade entre uma vítima e uma pessoa que não esteja na lista de restrições correspondente.

## Tecnologias

- Node.js 22 ou superior e npm.
- TypeScript com módulos ES e compilação pelo `tsc`.
- `tsx` para executar o TypeScript em desenvolvimento.
- `node:test` e `node:assert/strict` para os testes, sem framework adicional.
- APIs nativas do Node.js para leitura progressiva de arquivos e gravação de JSON.

## Estrutura do repositório

```text
spacecom-encounter-detection/
├── README.md
└── backend/
    ├── datasets/
    │   ├── examples/
    │   │   ├── dataset1.txt
    │   │   ├── dataset2.txt
    │   │   └── dataset3.txt ... dataset7.txt (download local; ignorados pelo Git)
    │   └── expected/
    │       ├── first_answers.json
    │       └── second_answers.json
    ├── outputs/
    │   └── output1.json ... output7.json
    ├── src/
    │   ├── features/encounters/detect.ts
    │   ├── types/encounter.ts
    │   ├── types/position.ts
    │   ├── utils/parser.ts
    │   ├── app.ts
    │   ├── geolocation.ts
    │   └── validate.ts
    ├── tests/
    │   ├── encounter.test.ts
    │   ├── geolocation.test.ts
    │   └── parser.test.ts
    ├── .gitignore
    ├── eslint.config.ts
    ├── package.json
    ├── package-lock.json
    ├── tsconfig.json
    └── tsconfig.test.json
```

`node_modules/` e `dist/` são diretórios locais gerados por instalação e build e estão excluídos pelo `.gitignore`. Os datasets 3 a 7 também são excluídos pelo tamanho; seus outputs JSON permanecem versionados no repositório.

## Responsabilidades dos módulos

| Módulo | Responsabilidade |
| --- | --- |
| `src/app.ts` | Lê o arquivo por stream, agrupa registros consecutivos pelo timestamp, chama o detector e grava o JSON de saída. |
| `src/utils/parser.ts` | Interpreta e valida cada registro, incluindo campos, coordenadas, booleano, restrições e data/hora. |
| `src/geolocation.ts` | Calcula a distância de Haversine e expõe a regra geográfica de proximidade. |
| `src/features/encounters/detect.ts` | Converte posições para coordenadas cartesianas, busca candidatos na grade espacial, classifica e deduplica encontros. |
| `src/types/position.ts` | Define o tipo de posição parseada. |
| `src/types/encounter.ts` | Define os tipos aceitos e o contrato dos encontros de saída. |
| `src/validate.ts` | Compara os outputs 1 e 2 com os gabaritos locais, incluindo posições e distância. |
| `tests/` | Verifica cálculo geográfico, detecção, classificação, formato e validação do parser. |

## Formato dos dados

O input é um arquivo de texto UTF-8, com cabeçalho e sete campos separados por ponto e vírgula:

```text
idMonitorado;faccaoMonitorado;timestamp;latitude;longitude;medidaProtetiva;idsRestricaoMedida
40;2;"2024-01-01 00:01:50";-10.07996;-37.08384;false;
41;;"2024-01-01 00:01:50";-10.07987;-37.08389;true;"40"
```

IDs e coordenadas são numéricos; latitude deve estar entre -90 e 90 e longitude entre -180 e 180. Facção pode estar vazia. `medidaProtetiva` aceita `true` ou `false`; o último campo pode estar vazio ou conter IDs separados por vírgula. Timestamps devem seguir `YYYY-MM-DD HH:MM:SS` e representar uma data e hora válidas.

Cada output é um array JSON. Um item segue esta estrutura ilustrativa:

```json
[
  {
    "tipo": "faccao",
    "monitoradosEncontro": [40, 44],
    "timestamp": "2024-01-01 00:01:50",
    "posicoes": {
      "40": { "lat": -10.07996, "lon": -37.08384 },
      "44": { "lat": -10.07987, "lon": -37.08389 }
    },
    "distanciaMetros": 11.406788673336607
  }
]
```

As posições são indexadas pelas chaves que correspondem aos IDs. `distanciaMetros` contém o valor de Haversine não arredondado usado pelo detector.

## Algoritmo e desempenho

A distância é calculada pela fórmula de Haversine:

```text
a = sen²(Δlatitude / 2)
  + cos(latitude₁) × cos(latitude₂) × sen²(Δlongitude / 2)
distância = 2 × 6.371.000 × asin(√a)
```

Os ângulos são convertidos para radianos. O encontro só é aceito se a distância resultante for menor que 20 metros; distância igual a 20 metros é rejeitada. Antes do cálculo de Haversine, cada posição é projetada em coordenadas cartesianas tridimensionais sobre uma esfera de raio 6.371.000 m. O detector distribui essas coordenadas em células cúbicas de 20 m e consulta a célula da posição e as 26 células vizinhas. A grade filtra candidatos; Haversine continua sendo a verificação final.

Se um timestamp tiver `k` posições, a comparação ingênua de todos os pares pode exigir `O(k²)` cálculos de distância. A grade evita a maioria dessas comparações quando as pessoas estão geograficamente dispersas; o trabalho esperado depende do número de candidatos locais. Em concentrações densas, o pior caso continua sendo quadrático, e a criação de todos os encontros próximos também pode exigir `O(k²)` espaço de saída.

A leitura do arquivo é progressiva: o programa mantém em memória o grupo do timestamp corrente, o índice espacial desse grupo e os encontros encontrados. O array final de encontros permanece em memória até a gravação do JSON. A deduplicação usa timestamp e IDs ordenados, portanto a ordem de chegada dos dois envolvidos não cria uma segunda ocorrência.

### Premissa temporal

O processamento pressupõe que as linhas estão ordenadas cronologicamente e que posições do mesmo timestamp aparecem em sequência. O enunciado exige igualdade de timestamp, mas não determina a ordenação dos registros. Os sete datasets locais foram examinados: todos estão em ordem cronológica, sem regressões, com grupos de 10, 20, 40, 60, 80, 100 e 120 registros por timestamp, respectivamente.

Para preservar o streaming e o uso de memória, o programa rejeita uma regressão temporal em vez de armazenar todo o dataset para reagrupar. Uma entrada não ordenada precisa ser ordenada antes do processamento.

## Pré-requisitos e instalação

É necessário Node.js 22 ou superior e npm. Os comandos npm devem ser executados a partir de `backend/`.

```bash
git clone https://github.com/SantV7/spacecom-encounter-detection.git
cd spacecom-encounter-detection/backend
npm ci
```

## Executar a aplicação

Para processar o primeiro dataset incluído no repositório, sem sobrescrever o resultado entregue:

```bash
npm run dev -- datasets/examples/dataset1.txt outputs/reproduced/output1.json
```

O primeiro argumento é o caminho do arquivo `.txt` de entrada; o segundo é o caminho do arquivo `.json` de saída. O separador `--` encaminha esses argumentos do npm para a aplicação. Os dois caminhos são relativos à pasta `backend`. O comando cria a pasta de destino quando necessário.

O script `dev` executa `tsx watch src/app.ts`. Ele pode continuar ativo depois de processar o arquivo para observar alterações; encerre-o com `Ctrl+C`. Para executar o JavaScript compilado, sem modo de observação:

```bash
npm run build
npm start -- datasets/examples/dataset1.txt outputs/reproduced/output1.json
```

### Scripts disponíveis

| Comando (na pasta `backend/`) | Finalidade |
| --- | --- |
| `npm ci` | Instala as dependências registradas no `package-lock.json`. |
| `npm run dev -- <entrada.txt> <saida.json>` | Executa a CLI em TypeScript com `tsx watch`. |
| `npm run build` | Compila `src/` para `dist/`. |
| `npm start -- <entrada.txt> <saida.json>` | Executa a CLI compilada em `dist/app.js`. |
| `npm run typecheck` | Verifica os tipos do código de produção sem emitir arquivos. |
| `npm run test:typecheck` | Verifica os tipos do código e dos testes sem emitir arquivos. |
| `npm test` | Executa os testes com o test runner nativo `node:test`. |
| `npm run validate` | Compara os outputs 1 e 2 com os gabaritos oficiais locais. |

## Datasets e reprodução dos outputs

Os datasets 1 e 2 estão versionados em `backend/datasets/examples/`. Os datasets 3 a 7 são grandes e ficam fora do Git; podem ser baixados dos endereços oficiais:

| Dataset | Input oficial | Output entregue |
| ---: | --- | --- |
| 1 | [dataset1.txt](https://bucket-projeto-trainee.s3.sa-east-1.amazonaws.com/dataset1.txt) | [output1.json](backend/outputs/output1.json) |
| 2 | [dataset2.txt](https://bucket-projeto-trainee.s3.sa-east-1.amazonaws.com/dataset2.txt) | [output2.json](backend/outputs/output2.json) |
| 3 | [dataset3.txt](https://bucket-projeto-trainee.s3.sa-east-1.amazonaws.com/dataset3.txt) | [output3.json](backend/outputs/output3.json) |
| 4 | [dataset4.txt](https://bucket-projeto-trainee.s3.sa-east-1.amazonaws.com/dataset4.txt) | [output4.json](backend/outputs/output4.json) |
| 5 | [dataset5.txt](https://bucket-projeto-trainee.s3.sa-east-1.amazonaws.com/dataset5.txt) | [output5.json](backend/outputs/output5.json) |
| 6 | [dataset6.txt](https://bucket-projeto-trainee.s3.sa-east-1.amazonaws.com/dataset6.txt) | [output6.json](backend/outputs/output6.json) |
| 7 | [dataset7.txt](https://bucket-projeto-trainee.s3.sa-east-1.amazonaws.com/dataset7.txt) | [output7.json](backend/outputs/output7.json) |

Para baixar os datasets 3 a 7, execute um dos blocos a seguir a partir de `backend/`.

PowerShell (Windows):

```powershell
New-Item -ItemType Directory -Force -Path "datasets/examples" | Out-Null

foreach ($n in 3..7) {
    $url = "https://bucket-projeto-trainee.s3.sa-east-1.amazonaws.com/dataset${n}.txt"
    $destination = "datasets/examples/dataset${n}.txt"
    curl.exe -fL --retry 3 -o $destination $url
    if ($LASTEXITCODE -ne 0) {
        throw "Falha ao baixar dataset ${n}"
    }
}
```

Bash (Linux/macOS):

```bash
mkdir -p datasets/examples
for n in 3 4 5 6 7; do
  curl -fL --retry 3 \
    "https://bucket-projeto-trainee.s3.sa-east-1.amazonaws.com/dataset${n}.txt" \
    -o "datasets/examples/dataset${n}.txt" || exit 1
done
```

Para gerar novamente os sete resultados sem sobrescrever os outputs entregues, use o diretório `outputs/reproduced/`. Execute os comandos na pasta `backend/` depois de baixar todos os inputs.

PowerShell (Windows):

```powershell
npm run build
foreach ($n in 1..7) {
    npm start -- "datasets/examples/dataset${n}.txt" "outputs/reproduced/output${n}.json"
    if ($LASTEXITCODE -ne 0) {
        throw "Falha ao processar dataset ${n}"
    }
}
```

Bash (Linux/macOS):

```bash
npm run build
for n in 1 2 3 4 5 6 7; do
  npm start -- "datasets/examples/dataset${n}.txt" \
    "outputs/reproduced/output${n}.json" || exit 1
done
```

Para processar apenas um dataset, substitua `n` nos caminhos pelos números correspondentes. A CLI cria as pastas de saída. Use nomes alternativos se não quiser sobrescrever um arquivo existente.

## Testes, tipagem e validação

Execute os comandos a partir de `backend/`:

```bash
npm run typecheck
npm run test:typecheck
npm test
npm run build
npm run validate
```

`npm run validate` lê os outputs existentes e os gabaritos `datasets/expected/first_answers.json` e `datasets/expected/second_answers.json`. Ele compara tipo, timestamp, IDs, posições e distância com tolerância de `1e-6` metro. Não gera nem sobrescreve outputs.

A suíte contém 27 testes com `node:test`, cobrindo cálculo geográfico, fronteira de 20 metros, vizinhança entre células, classificação, deduplicação, contrato do encontro e validação de registros pelo parser.

## Resultados entregues

| Dataset | Encontros no output | Verificação disponível |
| ---: | ---: | --- |
| 1 | 4 | Corresponde ao gabarito oficial local. |
| 2 | 6 | Corresponde ao gabarito oficial local. |
| 3 | 10 | Estrutura JSON; não há gabarito público disponível. |
| 4 | 15 | Estrutura JSON; não há gabarito público disponível. |
| 5 | 21 | Estrutura JSON; não há gabarito público disponível. |
| 6 | 27 | Estrutura JSON; não há gabarito público disponível. |
| 7 | 35 | Estrutura JSON; não há gabarito público disponível. |
| **Total** | **118** | Sete outputs entregues. |

Os outputs 1 e 2 têm, respectivamente, quatro e seis encontros, sem ausentes ou incorretos na comparação com os gabaritos disponíveis. Os datasets 3 a 7 não têm gabaritos públicos; a contagem e a validade estrutural dos JSONs não comprovam a precisão integral desses resultados.

## Limitações e premissas

- A entrada precisa estar ordenada cronologicamente, com registros de um mesmo timestamp contíguos. O app acusa timestamps regressivos; ele não reordena nem mantém o arquivo inteiro em memória.
- A grade espacial reduz comparações em dados dispersos, mas pode se aproximar do caso quadrático em grupos densos.
- O array de encontros permanece em memória até a serialização do JSON; entradas com quantidade excepcional de encontros podem elevar o consumo de memória.
- Os datasets 3 a 7 não têm gabaritos públicos para comparação independente.
- Os resultados de referência dos datasets 1 e 2 podem ser revalidados com `npm run validate`.

O projeto não inclui servidor HTTP, banco de dados ou containers: esses componentes não são necessários para os requisitos da CLI.

## Referências

- [Gabarito do dataset 1](backend/datasets/expected/first_answers.json)
- [Gabarito do dataset 2](backend/datasets/expected/second_answers.json)
- [Repositório do projeto no GitHub](https://github.com/SantV7/spacecom-encounter-detection)
