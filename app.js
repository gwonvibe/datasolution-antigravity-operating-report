/**
 * 교육·연구 프로그램 운영실적 보고서 도구
 * 의존성 없는 순수 JavaScript
 */

const DEFAULT_CSV_DATA = `운영일,프로그램명,대상,운영부서,참여인원,수료인원,교육시간,집행비용
2026-09-01,공공데이터 분석 실무과정,공공기관재직자,공공정책연구센터,32,30,16,4800000
2026-09-03,연구윤리 및 연구과제 기획 세미나,연구원,산학협력단,45,45,4,1800000
2026-09-05,디지털 혁신 교수법 워크숍,교원,미래교육기획실,28,26,8,2200000
2026-09-08,인공지능 기반 업무자동화 입문,행정실무자,인재개발원,40,38,12,3600000
2026-09-10,공공정책 평가모형 실습,공공기관재직자,공공정책연구센터,25,23,16,4200000
2026-09-12,고급 통계분석 및 시각화 특강,대학원생,데이터융합연구소,35,32,10,3100000
2026-09-15,대학 재정지원사업 성과관리 직무교육,행정실무자,인재개발원,50,48,8,2500000
2026-09-17,생성형 AI 학술연구 응용 전략,교원,미래교육기획실,42,40,6,2800000
2026-09-19,국책 연구과제 회계정산 및 감사 대비,연구원,산학협력단,38,36,6,1900000
2026-09-22,빅데이터 기반 정책의사결정 포럼,공공기관재직자,데이터융합연구소,60,58,4,5500000
2026-09-24,학생 맞춤형 학습코칭 역량강화,교원,미래교육기획실,30,29,8,2100000
2026-09-26,차세대 행정정보시스템 활용 심화,행정실무자,인재개발원,35,35,8,1750000
2026-09-29,공공의료 데이터 분석 및 정책세미나,공공기관재직자,공공정책연구센터,28,26,12,3900000
2026-10-01,글로벌 학술지 논문투고 및 동료평가,연구원,산학협력단,40,39,8,2600000
2026-10-05,머신러닝 알고리즘 모델링 캠프,대학원생,데이터융합연구소,30,27,24,6200000
2026-10-07,디지털 전환기 조직관리 리더십,행정실무자,인재개발원,24,24,6,1500000
2026-10-10,공공부문 규제혁신 워크숍,공공기관재직자,공공정책연구센터,36,34,8,2900000
2026-10-12,에듀테크 활용 블렌디드 러닝 설계,교원,미래교육기획실,32,31,8,2400000
2026-10-14,연구실 안전 및 연구보안 실무,연구원,산학협력단,55,55,4,1300000
2026-10-16,텍스트 마이닝 정책여론 분석,공공기관재직자,데이터융합연구소,26,24,16,4600000
2026-10-19,학술연구비 집행관리 표준가이드,행정실무자,산학협력단,48,46,6,1850000
2026-10-21,융복합 연구협력 네트워크 워크숍,연구원,데이터융합연구소,34,33,8,3300000
2026-10-22,지방소멸 대응 지역혁신 정책포럼,공공기관재직자,공공정책연구센터,52,50,4,4900000
2026-10-23,AI 코딩 기반 데이터 분석 기초,대학원생,인재개발원,38,36,16,3900000
2026-10-24,플립러닝 강의계획서 작성 클리닉,교원,미래교육기획실,22,22,6,1700000`;

// 한국어 조사 자동 판정 유틸리티
function hasFinalConsonant(str) {
  if (!str || str.length === 0) return false;
  const lastChar = str[str.length - 1];
  const code = lastChar.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return false; // 한글 음절 범위 밖
  return (code - 0xac00) % 28 !== 0;
}

function attachJosa(word, josaType) {
  const finalCons = hasFinalConsonant(word);
  if (josaType === '이/가') return word + (finalCons ? '이' : '가');
  if (josaType === '은/는') return word + (finalCons ? '은' : '는');
  if (josaType === '을/를') return word + (finalCons ? '을' : '를');
  if (josaType === '으로/로') {
    if (!finalCons) return word + '로';
    // ㄹ 받침(종성 번호 8)인 경우 '로'
    const code = word[word.length - 1].charCodeAt(0);
    const jong = (code - 0xac00) % 28;
    return word + (jong === 8 ? '로' : '으로');
  }
  return word;
}

// 숫자 정제 및 파싱
function parseNumber(val) {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const cleaned = String(val).replace(/[^0-9.-]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function formatNumber(num) {
  return Number(num).toLocaleString('ko-KR');
}

function formatWon(num) {
  return Number(num).toLocaleString('ko-KR') + '원';
}

// CSV 파서 (따옴표 지원)
function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return { headers: [], rows: [] };

  const headers = parseCSVLine(lines[0]);
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = parseCSVLine(line);
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] !== undefined ? values[idx].trim() : '';
    });
    rows.push(row);
  }
  return { headers, rows };
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

// 현재 앱 상태
let currentSource = '내장 예시 데이터 (25건)';
let currentRows = [];
let currentHeaders = [];
let currentGroupBy = '운영부서';

function initApp() {
  const parsed = parseCSV(DEFAULT_CSV_DATA);
  currentHeaders = parsed.headers;
  currentRows = parsed.rows;
  renderAll();
}

function renderAll() {
  updateGroupByOptions();
  renderSummaryCards();
  renderGroupTable();
  renderAutoOpinion();
  renderVerification();
}

function updateGroupByOptions() {
  const select = document.getElementById('groupBySelect');
  if (!select) return;
  const preferred = ['운영부서', '대상'];
  const candidates = preferred.filter(p => currentHeaders.includes(p));
  if (candidates.length === 0) candidates.push(currentHeaders[0]);

  select.innerHTML = '';
  candidates.forEach(field => {
    const opt = document.createElement('option');
    opt.value = field;
    opt.textContent = field;
    if (field === currentGroupBy) opt.selected = true;
    select.appendChild(opt);
  });
}

function renderSummaryCards() {
  const totalCount = currentRows.length;
  const totalParticipants = currentRows.reduce((s, r) => s + parseNumber(r['참여인원']), 0);
  const totalCompleted = currentRows.reduce((s, r) => s + parseNumber(r['수료인원']), 0);
  const totalHours = currentRows.reduce((s, r) => s + parseNumber(r['교육시간']), 0);
  const totalCost = currentRows.reduce((s, r) => s + parseNumber(r['집행비용']), 0);
  const completionRate = totalParticipants > 0 ? ((totalCompleted / totalParticipants) * 100).toFixed(1) : '0.0';

  const docMeta = document.getElementById('docMeta');
  if (docMeta) {
    const today = new Date().toISOString().slice(0, 10);
    docMeta.textContent = `자료: ${currentSource} · 총 ${totalCount}건 · 작성일 ${today}`;
  }

  const kpiTotalCount = document.getElementById('kpiTotalCount');
  if (kpiTotalCount) kpiTotalCount.textContent = formatNumber(totalCount) + '건';

  const kpiParticipants = document.getElementById('kpiParticipants');
  if (kpiParticipants) {
    kpiParticipants.innerHTML = `${formatNumber(totalParticipants)}<em>명</em> <span class="sub-val">(수료 ${formatNumber(totalCompleted)}명 / ${completionRate}%)</span>`;
  }

  const kpiHours = document.getElementById('kpiHours');
  if (kpiHours) kpiHours.innerHTML = `${formatNumber(totalHours)}<em>시간</em>`;

  const kpiCost = document.getElementById('kpiCost');
  if (kpiCost) kpiCost.innerHTML = `${formatWon(totalCost)}`;
}

function calculateGroupData() {
  const groups = {};
  currentRows.forEach(row => {
    const key = row[currentGroupBy] || '(미분류)';
    if (!groups[key]) {
      groups[key] = {
        key: key,
        count: 0,
        participants: 0,
        completed: 0,
        hours: 0,
        cost: 0
      };
    }
    groups[key].count++;
    groups[key].participants += parseNumber(row['참여인원']);
    groups[key].completed += parseNumber(row['수료인원']);
    groups[key].hours += parseNumber(row['교육시간']);
    groups[key].cost += parseNumber(row['집행비용']);
  });

  const list = Object.values(groups);
  const totalCost = list.reduce((s, g) => s + g.cost, 0);

  list.forEach(g => {
    g.share = totalCost > 0 ? (g.cost / totalCost) * 100 : 0;
  });

  // 집행비용 내림차순 정렬
  list.sort((a, b) => b.cost - a.cost);
  return list;
}

function renderGroupTable() {
  const tbody = document.getElementById('groupTableBody');
  const tfoot = document.getElementById('groupTableFoot');
  const groupColHeader = document.getElementById('groupColHeader');
  const groupSectionTitle = document.getElementById('groupSectionTitle');
  if (!tbody || !tfoot) return;

  if (groupColHeader) groupColHeader.textContent = currentGroupBy;
  if (groupSectionTitle) groupSectionTitle.textContent = `2. ${currentGroupBy}별 세부 집계표`;

  const groupList = calculateGroupData();
  const totalCount = groupList.reduce((s, g) => s + g.count, 0);
  const totalParticipants = groupList.reduce((s, g) => s + g.participants, 0);
  const totalCompleted = groupList.reduce((s, g) => s + g.completed, 0);
  const totalHours = groupList.reduce((s, g) => s + g.hours, 0);
  const totalCost = groupList.reduce((s, g) => s + g.cost, 0);
  const totalShare = groupList.reduce((s, g) => s + g.share, 0);

  tbody.innerHTML = '';
  groupList.forEach((g, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td class="font-bold text-left">${g.key}</td>
      <td class="text-right">${formatNumber(g.count)}건</td>
      <td class="text-right">${formatNumber(g.participants)}명</td>
      <td class="text-right">${formatNumber(g.completed)}명</td>
      <td class="text-right">${formatNumber(g.hours)}시간</td>
      <td class="text-right font-bold">${formatWon(g.cost)}</td>
      <td class="text-right">${g.share.toFixed(1)}%</td>
    `;
    tbody.appendChild(tr);
  });

  tfoot.innerHTML = `
    <tr class="table-total-row">
      <td colspan="2" class="text-center font-bold">전체 합계</td>
      <td class="text-right font-bold">${formatNumber(totalCount)}건</td>
      <td class="text-right font-bold">${formatNumber(totalParticipants)}명</td>
      <td class="text-right font-bold">${formatNumber(totalCompleted)}명</td>
      <td class="text-right font-bold">${formatNumber(totalHours)}시간</td>
      <td class="text-right font-bold text-accent">${formatWon(totalCost)}</td>
      <td class="text-right font-bold">${totalShare.toFixed(1)}%</td>
    </tr>
  `;
}

function renderAutoOpinion() {
  const opinionArea = document.getElementById('opinionText');
  if (!opinionArea) return;

  const groupList = calculateGroupData();
  if (groupList.length === 0) {
    opinionArea.value = '집계할 데이터가 없습니다.';
    return;
  }

  const topGroup = groupList[0];
  const lowestGroup = groupList[groupList.length - 1];

  const totalParticipants = groupList.reduce((s, g) => s + g.participants, 0);
  const totalCompleted = groupList.reduce((s, g) => s + g.completed, 0);
  const totalCost = groupList.reduce((s, g) => s + g.cost, 0);
  const avgCompletionRate = totalParticipants > 0 ? ((totalCompleted / totalParticipants) * 100).toFixed(1) : 0;

  const topNameWithJosa1 = attachJosa(topGroup.key, '은/는');
  const topNameWithJosa2 = attachJosa(topGroup.key, '이/가');

  const sentence1 = `금번 교육·연구 프로그램 집행 결과, ${topNameWithJosa1} 총 ${formatWon(topGroup.cost)}(전체 대비 ${topGroup.share.toFixed(1)}%)의 예산을 집행하여 가장 높은 비중을 차지하였습니다.`;
  const sentence2 = `전체 참여인원은 ${formatNumber(totalParticipants)}명이며, 수료인원은 ${formatNumber(totalCompleted)}명으로 평균 수료율은 ${avgCompletionRate}%를 기록하여 안정적인 교육 성과를 도출하였습니다.`;
  const sentence3 = `${topNameWithJosa2} 가장 많은 인원(${formatNumber(topGroup.participants)}명)을 교육하였으며, 차후 프로그램 편성 시 예산 효율성과 부서별 수료율을 종합적으로 반영할 필요가 있습니다.`;

  opinionArea.value = `${sentence1}\n${sentence2}\n${sentence3}`;
}

// 자가 검산(Cross-Validation) 기능
function renderVerification() {
  const badge = document.getElementById('verificationBadge');
  if (!badge) return;

  // 원자료 기준 순수 합산
  const rawRowsCount = currentRows.length;
  const rawTotalParticipants = currentRows.reduce((s, r) => s + parseNumber(r['참여인원']), 0);
  const rawTotalCompleted = currentRows.reduce((s, r) => s + parseNumber(r['수료인원']), 0);
  const rawTotalHours = currentRows.reduce((s, r) => s + parseNumber(r['교육시간']), 0);
  const rawTotalCost = currentRows.reduce((s, r) => s + parseNumber(r['집행비용']), 0);

  // 그룹 집계표 기준 합산
  const groupList = calculateGroupData();
  const groupTotalParticipants = groupList.reduce((s, g) => s + g.participants, 0);
  const groupTotalCompleted = groupList.reduce((s, g) => s + g.completed, 0);
  const groupTotalHours = groupList.reduce((s, g) => s + g.hours, 0);
  const groupTotalCost = groupList.reduce((s, g) => s + g.cost, 0);
  const groupTotalShare = groupList.reduce((s, g) => s + g.share, 0);

  const matchParticipants = rawTotalParticipants === groupTotalParticipants;
  const matchCompleted = rawTotalCompleted === groupTotalCompleted;
  const matchHours = rawTotalHours === groupTotalHours;
  const matchCost = rawTotalCost === groupTotalCost;
  const matchShare = Math.abs(groupTotalShare - 100.0) < 0.1;

  const isAllValid = matchParticipants && matchCompleted && matchHours && matchCost && matchShare;

  if (isAllValid) {
    badge.className = 'verify-status verify-pass';
    badge.innerHTML = `
      <span class="verify-icon">✓</span>
      <strong>자동 검산 일치:</strong>
      원자료 ${rawRowsCount}행 · 참여인원 일치(${formatNumber(rawTotalParticipants)}명) · 수료인원 일치(${formatNumber(rawTotalCompleted)}명) · 교육시간 일치(${formatNumber(rawTotalHours)}시간) · 집행비용 일치(${formatWon(rawTotalCost)}) · 비중 합 100%
    `;
  } else {
    badge.className = 'verify-status verify-fail';
    badge.innerHTML = `
      <span class="verify-icon">⚠</span>
      <strong>자동 검산 불일치 경고:</strong>
      참여인원: ${matchParticipants ? '일치' : '불일치'}, 수료인원: ${matchCompleted ? '일치' : '불일치'}, 교육시간: ${matchHours ? '일치' : '불일치'}, 비용: ${matchCost ? '일치' : '불일치'}, 비중: ${matchShare ? '일치' : '불일치'}
    `;
  }
}

// 파일 읽기 (UTF-8 우선, 실패/깨짐 시 EUC-KR 재시도)
function handleFile(file) {
  if (!file) return;
  currentSource = file.name;

  const readWithEncoding = (encoding, onSuccess, onError) => {
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target.result;
      // 한글 대체 문자(깨짐) 확인
      if (encoding === 'UTF-8' && text.includes('\uFFFD')) {
        onError();
      } else {
        onSuccess(text);
      }
    };
    reader.onerror = () => onError();
    reader.readAsText(file, encoding);
  };

  readWithEncoding('UTF-8',
    text => {
      loadCSVText(text);
    },
    () => {
      console.warn('UTF-8 파싱 오류 또는 깨짐 감지. EUC-KR로 재시도합니다.');
      readWithEncoding('EUC-KR',
        text => {
          loadCSVText(text);
        },
        () => {
          alert('파일 인코딩을 해석할 수 없습니다.');
        }
      );
    }
  );
}

function loadCSVText(text) {
  const parsed = parseCSV(text);
  if (parsed.rows.length === 0) {
    alert('유효한 데이터 행을 찾을 수 없습니다.');
    return;
  }
  currentHeaders = parsed.headers;
  currentRows = parsed.rows;
  if (!currentHeaders.includes(currentGroupBy)) {
    currentGroupBy = currentHeaders.includes('운영부서') ? '운영부서' : currentHeaders[0];
  }
  renderAll();
}

// 브라우저 이벤트 바인딩
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    initApp();

    const fileInput = document.getElementById('csvFileInput');
    const dropZone = document.getElementById('dropZone');
    const groupBySelect = document.getElementById('groupBySelect');
    const printBtn = document.getElementById('printBtn');
    const resetBtn = document.getElementById('resetBtn');

    if (fileInput) {
      fileInput.addEventListener('change', e => {
        if (e.target.files && e.target.files[0]) {
          handleFile(e.target.files[0]);
        }
      });
    }

    if (dropZone) {
      dropZone.addEventListener('click', () => fileInput && fileInput.click());
      dropZone.addEventListener('dragover', e => {
        e.preventDefault();
        dropZone.classList.add('dragover');
      });
      dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
      dropZone.addEventListener('drop', e => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          handleFile(e.dataTransfer.files[0]);
        }
      });
    }

    if (groupBySelect) {
      groupBySelect.addEventListener('change', e => {
        currentGroupBy = e.target.value;
        renderAll();
      });
    }

    if (printBtn) {
      printBtn.addEventListener('click', () => window.print());
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        currentSource = '내장 예시 데이터 (25건)';
        initApp();
      });
    }
  });
}
