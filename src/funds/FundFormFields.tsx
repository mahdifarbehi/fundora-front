import { useMemo } from "react";
import { Form, Input, Select, Typography } from "antd";
import { formatNumber } from "../lib/money";
import { jalaliDayPossibilities, wrapsJalaliMonth } from "../lib/jalali";
import MoneyInput from "../components/MoneyInput";
import NumberInput from "../components/NumberInput";
import { strings } from "../lib/strings";

const { Text } = Typography;

/**
 * The fund settings form fields, shared by create and edit so the two can't drift. Renders inside
 * an Ant `<Form>` (reads `contribution_day` via Form context). `recommendedDay` is create-only: it
 * seeds the day field and shows a recommendation hint; edit passes the existing value via the
 * form's `initialValues` instead.
 */
export default function FundFormFields({ recommendedDay }: { recommendedDay?: number }) {
  const dayOptions = useMemo(
    () => Array.from({ length: 28 }, (_, i) => ({ value: i + 1, label: formatNumber(i + 1) })),
    [],
  );
  const selectedDay = Form.useWatch<number | undefined>("contribution_day");
  const possibilities = useMemo(
    () => (typeof selectedDay === "number" ? jalaliDayPossibilities(selectedDay) : []),
    [selectedDay],
  );

  return (
    <>
      <Form.Item
        name="name"
        label={strings.funds.nameLabel}
        rules={[{ required: true, message: strings.validation.nameRequired }]}
      >
        <Input autoFocus />
      </Form.Item>

      <Form.Item
        name="monthly_share_amount"
        label={strings.funds.monthlyShareLabel}
        rules={[{ required: true, message: strings.validation.amountRequired }]}
      >
        <MoneyInput />
      </Form.Item>

      <Form.Item
        name="default_loan_amount"
        label={strings.funds.defaultLoanLabel}
        rules={[{ required: true, message: strings.validation.amountRequired }]}
      >
        <MoneyInput />
      </Form.Item>

      <Form.Item
        name="default_installment_count"
        label={strings.funds.installmentCountLabel}
        rules={[{ required: true, message: strings.validation.countMin }]}
      >
        <NumberInput />
      </Form.Item>

      <Form.Item
        name="contribution_day"
        label={strings.funds.contributionDayLabel}
        initialValue={recommendedDay}
        extra={strings.funds.contributionDayGregorianNote}
        rules={[{ required: true, message: strings.validation.contributionDayRange }]}
      >
        <Select options={dayOptions} />
      </Form.Item>

      <div style={{ marginTop: -12, marginBottom: 16, lineHeight: 1.8 }}>
        {recommendedDay != null && (
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {strings.funds.contributionDayRecommend(formatNumber(recommendedDay))}
            </Text>
          </div>
        )}
        {possibilities.length > 0 && typeof selectedDay === "number" && (
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {strings.funds.contributionDayPossibilities(
                formatNumber(selectedDay),
                possibilities.map(formatNumber).join("، "),
              )}
            </Text>
          </div>
        )}
        {wrapsJalaliMonth(possibilities) && (
          <div>
            <Text type="warning" style={{ fontSize: 12 }}>
              {strings.funds.contributionDayWrapWarning}
            </Text>
          </div>
        )}
      </div>
    </>
  );
}
