import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Circle, Path, Text as SvgText } from 'react-native-svg';
import { ThemeColors, CategorySpending } from '../core/types';
import { formatCurrency } from '../utils/formatters';

interface DonutChartProps {
  colors: ThemeColors;
  data: CategorySpending[];
  totalCents: number;
  selectedCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
  size?: number;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
}

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
): string {
  const sweep = endAngle - startAngle;
  const largeArc = sweep > 180 ? 1 : 0;

  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);

  return [
    'M', start.x, start.y,
    'A', r, r, 0, largeArc, 1, end.x, end.y,
  ].join(' ');
}

export default function DonutChart({
  colors,
  data,
  totalCents,
  selectedCategoryId,
  onSelectCategory,
  size = 220,
}: DonutChartProps) {
  const cx = size / 2;
  const cy = size / 2;
  const strokeWidth = 28;
  const outerRadius = size / 2 - 4;
  const midRadius = outerRadius - strokeWidth / 2;
  const gap = 3; // gap in degrees between segments

  const filtered = data.filter((d) => d.totalCents > 0);
  const isSingle = filtered.length === 1;
  const isEmpty = filtered.length === 0 || totalCents <= 0;

  // Build segments for multiple categories
  const segments: Array<{
    id: string;
    color: string;
    startAngle: number;
    endAngle: number;
    percentage: number;
  }> = [];

  if (!isEmpty && !isSingle) {
    let currentAngle = 0;
    filtered.forEach((item) => {
      const sweep = (item.totalCents / totalCents) * 360;
      const startAngle = currentAngle + gap / 2;
      const endAngle = currentAngle + sweep - gap / 2;

      if (endAngle > startAngle + 0.5) {
        segments.push({
          id: item.category.id,
          color: item.category.color,
          startAngle,
          endAngle,
          percentage: item.percentage,
        });
      }
      currentAngle += sweep;
    });
  }

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {isEmpty ? (
          // Empty state: clean subtle circle
          <Circle
            cx={cx}
            cy={cy}
            r={midRadius}
            stroke={colors.border}
            strokeWidth={strokeWidth}
            fill="none"
          />
        ) : isSingle ? (
          // Single category: complete solid ring
          <Circle
            cx={cx}
            cy={cy}
            r={midRadius}
            stroke={filtered[0].category.color}
            strokeWidth={
              selectedCategoryId === filtered[0].category.id
                ? strokeWidth + 6
                : strokeWidth
            }
            fill="none"
            onPress={() =>
              onSelectCategory(
                selectedCategoryId === filtered[0].category.id
                  ? null
                  : filtered[0].category.id,
              )
            }
          />
        ) : (
          // Multiple categories: arc segments
          segments.map((seg) => {
            const isSelected = selectedCategoryId === seg.id;
            const sw = isSelected ? strokeWidth + 6 : strokeWidth;
            return (
              <Path
                key={seg.id}
                d={describeArc(cx, cy, midRadius, seg.startAngle, seg.endAngle)}
                stroke={seg.color}
                strokeWidth={sw}
                fill="none"
                strokeLinecap="round"
                onPress={() =>
                  onSelectCategory(selectedCategoryId === seg.id ? null : seg.id)
                }
              />
            );
          })
        )}

        {/* Center text: Total label and formatted currency */}
        <SvgText
          x={cx}
          y={cy - 6}
          textAnchor="middle"
          fontSize={12}
          fill={colors.textSecondary}
        >
          Total
        </SvgText>
        <SvgText
          x={cx}
          y={cy + 16}
          textAnchor="middle"
          fontSize={18}
          fontWeight="700"
          fill={colors.text}
        >
          {formatCurrency(totalCents)}
        </SvgText>
      </Svg>

      {/* Touch targets for easy one-handed segment selection */}
      {!isEmpty &&
        (isSingle ? (
          <TouchableOpacity
            style={[
              styles.hitTarget,
              {
                left: cx - 44,
                top: 4,
                width: 88,
                height: 44,
              },
            ]}
            onPress={() =>
              onSelectCategory(
                selectedCategoryId === filtered[0].category.id
                  ? null
                  : filtered[0].category.id,
              )
            }
            activeOpacity={0.7}
          />
        ) : (
          segments.map((seg) => {
            const midAngle = (seg.startAngle + seg.endAngle) / 2;
            const hitPoint = polarToCartesian(cx, cy, midRadius, midAngle);
            const hitSize = 44;
            return (
              <TouchableOpacity
                key={`touch-${seg.id}`}
                style={[
                  styles.hitTarget,
                  {
                    left: hitPoint.x - hitSize / 2,
                    top: hitPoint.y - hitSize / 2,
                    width: hitSize,
                    height: hitSize,
                  },
                ]}
                onPress={() =>
                  onSelectCategory(selectedCategoryId === seg.id ? null : seg.id)
                }
                activeOpacity={0.7}
              />
            );
          })
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    position: 'relative',
  },
  hitTarget: {
    position: 'absolute',
    borderRadius: 22,
  },
});
