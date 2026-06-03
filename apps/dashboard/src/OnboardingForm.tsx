import { useEffect, useState } from "react";

import type { MvpOnboardingData, MvpOnboardingResponse } from "@ivhome/shared";

// Admin-only onboarding form for medservice registration.
// Route: /admin/onboarding/:clinicId
// Renders as a multi-section form; saves to MvpOnboarding Prisma model via API.

interface OnboardingFormProps {
  clinicId: string;
  adminToken: string;
  apiBaseUrl: string;
}

type Section = "identity" | "license" | "capabilities" | "categories" | "safety" | "privacy";

const sectionLabels: Record<Section, string> = {
  identity: "А. Идентификация организации",
  license: "Б. Лицензионные сведения",
  capabilities: "В. Возможности и условия выезда",
  categories: "Г. Виды принимаемых заявок",
  safety: "Д. Безопасность и эскалация",
  privacy: "Е. Согласие с условиями платформы",
};

const sections: Section[] = ["identity", "license", "capabilities", "categories", "safety", "privacy"];

export function OnboardingForm({ clinicId, adminToken, apiBaseUrl }: OnboardingFormProps) {
  const [openSection, setOpenSection] = useState<Section>("identity");
  const [data, setData] = useState<MvpOnboardingData>({});
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;

    setStatus("idle");
    setMessage(null);
    setData({});

    void fetch(`${apiBaseUrl.replace(/\/+$/u, "")}/mvp/admin/onboarding/${encodeURIComponent(clinicId)}`, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    })
      .then(async (response) => {
        if (response.status === 404) {
          return null;
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        return (await response.json()) as MvpOnboardingResponse;
      })
      .then((loaded) => {
        if (!isCurrent || !loaded) {
          return;
        }

        setData(loaded.data ?? {});
        setMessage(loaded.status === "SUBMITTED" ? "Ранее отправленная анкета загружена." : "Черновик загружен.");
      })
      .catch(() => {
        if (isCurrent) {
          setStatus("error");
          setMessage("Не удалось загрузить сохранённую анкету. Можно заполнить форму заново.");
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [adminToken, apiBaseUrl, clinicId]);

  function update<K extends keyof MvpOnboardingData>(key: K, value: MvpOnboardingData[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave(submitStatus: "DRAFT" | "SUBMITTED") {
    setStatus("saving");
    setMessage(null);

    try {
      const response = await fetch(
        `${apiBaseUrl.replace(/\/+$/u, "")}/mvp/admin/onboarding/${encodeURIComponent(clinicId)}`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({ ...data, status: submitStatus }),
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      setStatus("saved");
      setMessage(submitStatus === "SUBMITTED" ? "Анкета отправлена на проверку." : "Черновик сохранён.");
    } catch {
      setStatus("error");
      setMessage("Ошибка сохранения. Проверьте подключение и попробуйте снова.");
    }
  }

  const isSaving = status === "saving";

  return (
    <div className="onboarding-form">
      <header className="onboarding-form__header">
        <h2>Анкета медицинской организации</h2>
        <p className="meta-label">ID: {clinicId}</p>
        <p>
          Заполните все разделы и нажмите «Отправить на проверку». Надом — агрегатор, а не медицинская
          организация. Все медицинские решения принимает выбранная организация.
        </p>
      </header>

      {sections.map((section) => (
        <details
          className="onboarding-section"
          key={section}
          open={openSection === section}
          onToggle={(e) => {
            if ((e.currentTarget as HTMLDetailsElement).open) {
              setOpenSection(section);
            }
          }}
        >
          <summary className="onboarding-section__title">{sectionLabels[section]}</summary>

          <div className="onboarding-section__body">
            {section === "identity" && (
              <>
                <label className="field">
                  <span>Публичное наименование медицинской организации</span>
                  <input
                    onChange={(e) => update("publicName", e.target.value)}
                    placeholder="Медицинская организация «Пример»"
                    type="text"
                    value={data.publicName ?? ""}
                  />
                </label>
                <label className="field">
                  <span>Полное юридическое наименование</span>
                  <input
                    onChange={(e) => update("legalName", e.target.value)}
                    placeholder="ООО «Пример Медицина»"
                    type="text"
                    value={data.legalName ?? ""}
                  />
                </label>
                <label className="field">
                  <span>ИНН (для проверки; не публикуется)</span>
                  <input
                    onChange={(e) => update("innPlaceholder", e.target.value)}
                    placeholder="0000000000"
                    type="text"
                    value={data.innPlaceholder ?? ""}
                  />
                </label>
                <label className="field">
                  <span>Зоны работы / районы выезда</span>
                  <textarea
                    onChange={(e) => update("operatingAreas", e.target.value)}
                    placeholder="CAO, CЗАО, Хамовники..."
                    rows={3}
                    value={data.operatingAreas ?? ""}
                  />
                </label>
              </>
            )}

            {section === "license" && (
              <>
                <label className="field">
                  <span>Номер лицензии</span>
                  <input
                    onChange={(e) => update("licenseNumber", e.target.value)}
                    placeholder="ЛО-77-01-XXXXXX"
                    type="text"
                    value={data.licenseNumber ?? ""}
                  />
                </label>
                <label className="field">
                  <span>Выдана органом</span>
                  <input
                    onChange={(e) => update("issuingAuthority", e.target.value)}
                    placeholder="Росздравнадзор"
                    type="text"
                    value={data.issuingAuthority ?? ""}
                  />
                </label>
                <label className="field">
                  <span>Дата выдачи</span>
                  <input
                    onChange={(e) => update("issueDate", e.target.value)}
                    type="date"
                    value={data.issueDate ?? ""}
                  />
                </label>
                <label className="field">
                  <span>Ссылка в реестре Росздравнадзора</span>
                  <input
                    onChange={(e) => update("registryUrl", e.target.value)}
                    placeholder="https://lir.roszdravnadzor.gov.ru/..."
                    type="url"
                    value={data.registryUrl ?? ""}
                  />
                </label>
                {/* TODO: add file upload for license scan when storage is ready */}
                <p className="field-hint">Загрузка скана лицензии будет добавлена в следующей версии.</p>
              </>
            )}

            {section === "capabilities" && (
              <>
                <label className="field">
                  <span>Часы работы</span>
                  <input
                    onChange={(e) => update("operatingHours", e.target.value)}
                    placeholder="Круглосуточно / 09:00–22:00"
                    type="text"
                    value={data.operatingHours ?? ""}
                  />
                </label>
                <label className="field">
                  <span>Время ответа на заявку (минут)</span>
                  <input
                    min={0}
                    onChange={(e) => update("responseTimeMinutes", Number(e.target.value) || undefined)}
                    placeholder="10"
                    type="number"
                    value={data.responseTimeMinutes ?? ""}
                  />
                </label>
                <label className="field">
                  <span>Время прибытия после подтверждения (минут)</span>
                  <input
                    min={0}
                    onChange={(e) => update("arrivalTimeMinutes", Number(e.target.value) || undefined)}
                    placeholder="40"
                    type="number"
                    value={data.arrivalTimeMinutes ?? ""}
                  />
                </label>
                <label className="field">
                  <span>Минимальная стоимость выезда (руб.)</span>
                  <input
                    min={0}
                    onChange={(e) => update("priceRangeMin", Number(e.target.value) || undefined)}
                    placeholder="8500"
                    type="number"
                    value={data.priceRangeMin ?? ""}
                  />
                </label>
                <label className="field">
                  <span>Максимальная стоимость выезда (руб.)</span>
                  <input
                    min={0}
                    onChange={(e) => update("priceRangeMax", Number(e.target.value) || undefined)}
                    placeholder="12000"
                    type="number"
                    value={data.priceRangeMax ?? ""}
                  />
                </label>
                <label className="field">
                  <span>Условия отмены заявки</span>
                  <textarea
                    onChange={(e) => update("cancellationTerms", e.target.value)}
                    placeholder="Бесплатная отмена до выезда бригады..."
                    rows={3}
                    value={data.cancellationTerms ?? ""}
                  />
                </label>
              </>
            )}

            {section === "categories" && (
              <>
                <p className="field-hint">
                  Отметьте виды заявок, которые медицинская организация способна рассмотреть. Надом передаёт
                  заявку — медицинское решение о возможности и составе выезда принимает выбранная организация.
                </p>
                <label className="field field--checkbox">
                  <input
                    checked={data.acceptsHomeVisits ?? false}
                    onChange={(e) => update("acceptsHomeVisits", e.target.checked)}
                    type="checkbox"
                  />
                  <span>Выездной медицинский осмотр на дому</span>
                </label>
                <label className="field field--checkbox">
                  <input
                    checked={data.acceptsNurseVisits ?? false}
                    onChange={(e) => update("acceptsNurseVisits", e.target.checked)}
                    type="checkbox"
                  />
                  <span>Выезд медицинской сестры / медицинского специалиста</span>
                </label>
                <label className="field field--checkbox">
                  <input
                    checked={data.acceptsIvReview ?? false}
                    onChange={(e) => update("acceptsIvReview", e.target.checked)}
                    type="checkbox"
                  />
                  <span>Рассмотрение заявок на капельное введение препаратов на дому</span>
                </label>
                <label className="field">
                  <span>Другие возможности (описание)</span>
                  <textarea
                    onChange={(e) => update("otherCapabilities", e.target.value)}
                    placeholder="Опишите дополнительные виды услуг..."
                    rows={3}
                    value={data.otherCapabilities ?? ""}
                  />
                </label>
              </>
            )}

            {section === "safety" && (
              <>
                <p className="field-hint">
                  Эти сведения используются только для операционного контроля. Надом не предоставляет
                  медицинских консультаций и не выдаёт клинических рекомендаций.
                </p>
                <label className="field">
                  <span>Критерии отказа в выезде / красные флаги</span>
                  <textarea
                    onChange={(e) => update("redFlagCriteria", e.target.value)}
                    placeholder="Признаки, при которых организация не осуществляет выезд..."
                    rows={4}
                    value={data.redFlagCriteria ?? ""}
                  />
                </label>
                <label className="field">
                  <span>Порядок эскалации (103 / 112)</span>
                  <textarea
                    onChange={(e) => update("escalationPolicy", e.target.value)}
                    placeholder="Опишите, как организация действует при выявлении неотложных состояний..."
                    rows={4}
                    value={data.escalationPolicy ?? ""}
                  />
                </label>
                <label className="field">
                  <span>Политика по рецептурным, контролируемым и седативным препаратам</span>
                  <textarea
                    onChange={(e) => update("controlledMedicationPolicy", e.target.value)}
                    placeholder="Опишите общий порядок проверки назначений, документов и ограничений по препаратам..."
                    rows={4}
                    value={data.controlledMedicationPolicy ?? ""}
                  />
                </label>
              </>
            )}

            {section === "privacy" && (
              <>
                <p className="field-hint">
                  Надом — агрегатор. Платформа передаёт выбранной организации только необходимые для
                  подтверждения выезда данные. Организация не вправе передавать эти данные третьим лицам.
                </p>
                <label className="field field--checkbox">
                  <input
                    checked={data.agreeNoUserDataSharing ?? false}
                    onChange={(e) => update("agreeNoUserDataSharing", e.target.checked)}
                    type="checkbox"
                  />
                  <span>
                    Медицинская организация обязуется не передавать персональные данные пользователей третьим лицам
                    без явного согласия пользователя.
                  </span>
                </label>
                <label className="field field--checkbox">
                  <input
                    checked={data.agreeNeutralNotificationsOnly ?? false}
                    onChange={(e) => update("agreeNeutralNotificationsOnly", e.target.checked)}
                    type="checkbox"
                  />
                  <span>
                    Медицинская организация согласна с тем, что Надом направляет пользователю нейтральные
                    статусные уведомления от имени платформы, а не от имени организации.
                  </span>
                </label>
              </>
            )}
          </div>
        </details>
      ))}

      {message ? <p className={`onboarding-message onboarding-message--${status}`}>{message}</p> : null}

      <div className="onboarding-form__actions">
        <button disabled={isSaving} onClick={() => void handleSave("DRAFT")} type="button">
          {isSaving ? "Сохраняем…" : "Сохранить черновик"}
        </button>
        <button
          className="button--primary"
          disabled={isSaving || !(data.agreeNoUserDataSharing && data.agreeNeutralNotificationsOnly)}
          onClick={() => void handleSave("SUBMITTED")}
          type="button"
        >
          Отправить на проверку
        </button>
      </div>
    </div>
  );
}
