interface StatsProps {
  content: {
    title: string;
    items: Array<{
      value: string;
      label: string;
    }>;
  };
}

export const Stats = ({ content }: StatsProps) => {
  return (
    <section className="py-20 px-6 bg-gradient-to-br from-primary to-secondary text-white">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          {content.title}
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {content.items.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl md:text-5xl font-bold mb-2">
                {stat.value}
              </div>
              <div className="text-lg opacity-90">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
