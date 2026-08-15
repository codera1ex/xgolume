import React, { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { IndianRupee, PieChart as PieIcon, Wallet, Users, Calendar } from "lucide-react";
import { Trip } from "../types";

interface BudgetDonutChartProps {
  trip: Trip;
}

export const BudgetDonutChart: React.FC<BudgetDonutChartProps> = ({ trip }) => {
  const { chartData, totalCalculated } = useMemo(() => {
    let activitiesCost = 0;
    let foodCost = 0;
    let stayCost = 0;
    let transportCost = 0;
    let otherCost = 0;

    trip.itinerary.forEach((day) => {
      [...day.morning, ...day.afternoon, ...day.evening].forEach((act) => {
        const cost = act.costEstimate || 0;
        if (act.category === "attraction" || act.category === "activity") {
          activitiesCost += cost;
        } else if (act.category === "food") {
          foodCost += cost;
        } else if (act.category === "stay") {
          stayCost += cost;
        } else if (act.category === "transport") {
          transportCost += cost;
        } else {
          otherCost += cost;
        }
      });
    });

    // If stayCost is 0, estimate from recommendedStays if available
    if (stayCost === 0 && trip.recommendedStays.length > 0) {
      const avgStay = Math.round(
        trip.recommendedStays.reduce((acc, s) => acc + s.pricePerNight, 0) / trip.recommendedStays.length
      );
      stayCost = avgStay * trip.durationDays;
    }

    // Default proportional allocation if itinerary activity costs are unassigned
    if (activitiesCost === 0 && foodCost === 0 && stayCost === 0) {
      activitiesCost = Math.round(trip.estimatedCost * 0.35);
      foodCost = Math.round(trip.estimatedCost * 0.25);
      stayCost = Math.round(trip.estimatedCost * 0.30);
      transportCost = Math.round(trip.estimatedCost * 0.10);
    }

    const calculatedSum = activitiesCost + foodCost + stayCost + transportCost + otherCost;
    const buffer = Math.max(0, trip.estimatedCost - calculatedSum);

    const data = [
      { name: "Activities", value: activitiesCost, color: "#3B82F6" },  // Blue
      { name: "Food & Dining", value: foodCost, color: "#F59E0B" },     // Amber
      { name: "Stays & Hotels", value: stayCost, color: "#10B981" },    // Emerald
      { name: "Transport", value: transportCost, color: "#8B5CF6" },    // Purple
    ];

    if (otherCost > 0) {
      data.push({ name: "Other", value: otherCost, color: "#EC4899" }); // Pink
    }

    if (buffer > 0) {
      data.push({ name: "Buffer / Misc", value: buffer, color: "#64748B" }); // Slate
    }

    // Filter out 0 value entries
    const filteredData = data.filter((d) => d.value > 0);
    const sumTotal = filteredData.reduce((acc, d) => acc + d.value, 0);

    return { chartData: filteredData, totalCalculated: sumTotal };
  }, [trip]);

  const perPersonCost = Math.round(totalCalculated / (trip.travelersCount || 1));
  const perDayCost = Math.round(totalCalculated / (trip.durationDays || 1));

  return (
    <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/90 mb-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
            <PieIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-xs text-slate-900">Estimated Budget Breakdown</h3>
            <p className="text-[10px] text-slate-500">Categorized expense allocation for this trip</p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs font-black text-emerald-700 block">
            ₹{totalCalculated.toLocaleString("en-IN")}
          </span>
          <span className="text-[10px] text-slate-400">Total Estimated</span>
        </div>
      </div>

      {/* Donut Chart Container */}
      <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-4">
        {/* Recharts Donut Chart */}
        <div className="relative h-48 w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={76}
                paddingAngle={4}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="#FFFFFF" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip
                formatter={(val: number) => [`₹${val.toLocaleString("en-IN")}`, "Amount"]}
                contentStyle={{
                  backgroundColor: "#0F172A",
                  borderRadius: "12px",
                  color: "#FFF",
                  fontSize: "11px",
                  border: "none",
                  boxShadow: "0 10px 15px -3px rgba(0,0,0,0.3)"
                }}
                itemStyle={{ color: "#38BDF8", fontWeight: "bold" }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Center Label inside Donut Hole */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Est. Total</span>
            <span className="text-xs font-black text-slate-900">
              ₹{Math.round(totalCalculated / 1000)}k
            </span>
          </div>
        </div>

        {/* Breakdown Legend List */}
        <div className="space-y-2">
          {chartData.map((item, idx) => {
            const percentage = Math.round((item.value / totalCalculated) * 100) || 0;
            return (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="font-bold text-slate-800">{item.name}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-slate-900">
                    ₹{item.value.toLocaleString("en-IN")}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 bg-white px-1.5 py-0.5 rounded-md border border-slate-200">
                    {percentage}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Metrics Footer */}
      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 text-xs">
        <div className="bg-sky-50/70 p-2.5 rounded-xl border border-sky-100 flex items-center gap-2">
          <Users className="w-4 h-4 text-sky-600 shrink-0" />
          <div>
            <span className="text-[10px] text-sky-800 font-medium block">Per Person</span>
            <span className="font-extrabold text-sky-950">₹{perPersonCost.toLocaleString("en-IN")}</span>
          </div>
        </div>

        <div className="bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-100 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
          <div>
            <span className="text-[10px] text-emerald-800 font-medium block">Per Day</span>
            <span className="font-extrabold text-emerald-950">₹{perDayCost.toLocaleString("en-IN")}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
