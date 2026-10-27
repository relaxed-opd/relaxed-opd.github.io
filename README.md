# REOPOLD project page

**Scaling Reasoning Efficiently via Relaxed On-Policy Distillation · NeurIPS 2026**

`relaxed-opd.github.io`에 게시할 논문 프로젝트 페이지입니다. HTML/CSS/JavaScript만 사용하므로 빌드나 런타임 의존성 없이 GitHub Pages에서 동작합니다. npm 의존성은 로컬 브라우저 검증에만 사용합니다.

## GitHub에 게시하기

정확히 `https://relaxed-opd.github.io/` 주소를 사용하려면 **GitHub 계정 또는 organization `relaxed-opd`가 소유한 `relaxed-opd.github.io` 저장소**에 올려야 합니다. 다른 계정에 같은 이름의 저장소를 만들면 이 주소가 되지 않습니다.

1. `relaxed-opd` 계정/organization에서 빈 public repository `relaxed-opd.github.io`를 생성합니다.
2. 이 폴더 안에서 직접 커밋하고 푸시합니다.

   ```bash
   git add .
   git commit -m "Add REOPOLD project page"
   git remote add origin https://github.com/relaxed-opd/relaxed-opd.github.io.git
   git push -u origin main
   ```

3. 저장소 **Settings → Pages → Build and deployment → Source: Deploy from a branch**를 선택합니다.
4. **Branch: main / Folder: /(root)**로 저장합니다.
5. Pages 배포가 끝나면 `https://relaxed-opd.github.io/`에서 확인합니다.

`.nojekyll`이 포함되어 있습니다. 커스텀 도메인이 아니므로 `CNAME` 파일은 필요하지 않습니다. 이 작업에서는 원격 저장소 생성, 커밋, 푸시를 하지 않았습니다.

## 로컬 미리보기

```bash
cd relaxed-opd.github.io
python3 -m http.server 4173 --bind 127.0.0.1
```

브라우저에서 `http://127.0.0.1:4173`을 엽니다. 저장소 폴더 안에 이미 있다면 `cd` 명령은 생략합니다. Node.js가 있다면 `npm run preview`도 같습니다.

## 구성과 편집

| 파일 | 역할 |
|---|---|
| `index.html` | 제목, 저자, 초록, 방법 설명, 결과 표, 논문/arXiv 링크 |
| `assets/style.css` | 반응형 레이아웃, 색상, 모바일/인쇄 스타일 |
| `assets/site.js` | 단계별 토큰 선택 예시, 결과 탭, 그림 확대, BibTeX 복사 |
| `assets/paper/reopold.pdf` | 사용자가 지정한 camera-ready 제출본 |
| `assets/figures/*.webp` | 제출본에서 직접 잘라낸 그림 8개 |
| `assets/figures/manifest.json` | 그림의 원본 PDF 페이지와 crop 좌표 |
| `assets/citation.bib` | 다운로드용 BibTeX (`index.html`의 BibTeX와 함께 수정) |
| `assets/social-card.svg`, `.png` | 링크 공유용 이미지와 편집 가능한 원본 |
| `tests/site.spec.js` | 실제 Chromium 브라우저 기능/레이아웃 검증 및 스크린샷 생성 |

**Code 링크:** 공식 arXiv 페이지에는 코드 공개 예정으로 기재되어 있으므로, 가짜 저장소 링크 대신 `Code · coming soon`을 표시합니다. 공개할 코드 저장소가 준비되면 `index.html`의 `.button-unavailable` `<span>`을 실제 URL의 `<a class="button button-outline" ...>`로 변경합니다. 이 저장소는 학습 코드가 아니라 웹페이지 저장소입니다.

**자료 기준:** 수치, 초록, 그림은 `NeurIPS_2026__REOPOLD (7).pdf` 기준입니다. 같은 작업 폴더의 LaTeX 소스는 제출 PDF와 내용이 다른 부분이 있어 본문/결과의 기준으로 사용하지 않았습니다. Microsoft 소속 표시는 로컬 논문 LaTeX의 저자 소속을 따릅니다. arXiv 링크는 실제 공개된 `2603.11137`이며, 메인 OpenReview 버튼은 `https://openreview.net/forum?id=l0h1SzRI7H#discussion`을 엽니다. 상단 Read paper 버튼은 `https://arxiv.org/abs/2603.11137`을 엽니다.

## 결과 해석 시 주의사항

- 최대 **12×**는 AIME-25에서 다른 연구의 보고된 **생성 학습 시퀀스 수** 대비 비교입니다. 하드웨어, 데이터, 학습 레시피를 모두 통제한 wall-clock/FLOP 비교가 아닙니다.
- **3.32×**는 유사한 Pass@K에서 **7B REOPOLD 학생과 32B 교사**를 비교한 추론 지연 결과입니다. standard OPD 대비 속도 배율이 아닙니다.
- 토큰 선택 데모는 방법 이해를 위한 **합성 예시**입니다. 논문의 실측 토큰 trace나 학습 실행이 아닙니다.
- 탐색 단계는 floor보다 작은 credit을 **제외**하고, 정제 단계는 높은 entropy 토큰을 선택한 뒤 작은 credit을 floor로 **clip**합니다.
- 결과 탭은 평균 성능 개선을 설명하며, 모든 개별 benchmark에서의 우위를 주장하지 않습니다.
- 시각 추론 표는 가독성을 위해 평균만 표시합니다. 원문의 표 4에는 표준편차도 있습니다.

## 브라우저 검증 및 렌더링

Node.js 20 이상과 Python 3이 필요합니다.

```bash
npm ci
npx playwright install chromium
npm run check
npm test
```

검증은 데스크톱/모바일에서 로컬 자원, 앵커, 좁은 화면의 가로 넘침, 단계 전환, 키보드 결과 탭, 그림 확대/닫기, BibTeX 복사/실패 안내, JavaScript 비활성 상태를 확인합니다. `preview/`에 데스크톱/모바일 전체 페이지, 첫 화면, 방법 데모 스크린샷을 저장하고 `assets/social-card.png`도 생성합니다. `preview/`는 `.gitignore`에 포함되어 게시 저장소에 들어가지 않습니다.

다른 터미널에서 서버를 실행 중이면 테스트가 재사용합니다. 서버가 없으면 테스트가 자체 실행하고 종료합니다.

## PDF와 그림 다시 내보내기

기본 사용에는 필요하지 않습니다. PDF가 업데이트되고 **그림 위치가 그대로**라면:

```bash
# pdftoppm (Poppler), Python 3 + Pillow 필요
python3 scripts/export_assets.py "/absolute/path/to/updated-paper.pdf"
```

그림 위치가 바뀌면 `scripts/export_assets.py`의 페이지/crop 좌표도 먼저 수정해야 합니다. 좌표는 가로 928 × 세로 1200 inspection render 기준이며, 실제 자산은 더 높은 해상도로 내보냅니다. 이미지에 그래프 데이터를 임의로 재생성하거나 수정하지 않습니다. 표, 초록, 메타데이터는 수동으로 함께 갱신합니다.

## 디자인 참고

- [Flex-Judge](https://flex-judge.github.io/): 논문 제목, 저자, 리소스와 연구 설명 중심의 구성
- [OPRD](https://shenzhiyang2000.github.io/OPRD-project-page/): 방법과 정량 결과의 분리, 결과 요약
- [CURE (CVPR 2026)](https://pablomessina.github.io/cure-project-page/): 실제 논문 그림을 활용한 시각적 설명
- [Nerfies](https://nerfies.github.io/): 학술 프로젝트 페이지의 읽기 흐름과 인용 영역

위 페이지는 구성 참고용입니다. 템플릿 코드, 이미지, analytics를 복사하지 않고 새로 구현했습니다. 폰트 CDN, 원격 JavaScript, analytics, 외부 UI 라이브러리 없이 동작합니다.
